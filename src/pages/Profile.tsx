
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Avatar } from "@/components/ui/avatar";
import { UserCircle, Camera, Save, Check, X } from "lucide-react";
import NavigationBar from "@/components/NavigationBar";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { CheckIcon, PlusCircle } from "lucide-react";
import { StockSuggestion, UserProfile } from "@/types";

const Profile = () => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Profile Form State
  const [profileData, setProfileData] = useState({
    name: "",
    email: "",
    age: "",
    experience: "",
    riskTolerance: "Medium",
  });
  const [sectors, setSelectedSectors] = useState<string[]>([]);
  const [availableSectors, setAvailableSectors] = useState<{ id: string, name: string }[]>([]);
  const [showSectorSelector, setShowSectorSelector] = useState(false);

  useEffect(() => {
    const fetchProfileData = async () => {
      if (!user) return;
      try {
        setIsLoading(true);

        // 1. Basic User Data
        setProfileData(prevState => ({
          ...prevState,
          name: user.user_metadata?.full_name || "",
          email: user.email || "",
        }));

        // 2. Profile Details
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (error) throw error;

        if (data) {
          setProfileData(prevState => ({
            ...prevState,
            age: data.age?.toString() || "",
            experience: data.experience || "",
            riskTolerance: data.risk_tolerance || "Medium",
          }));
        }

        // 3. Sectors
        const { data: userSectorsData } = await supabase.from('user_sectors').select('sector').eq('user_id', user.id);
        const currentSectors = userSectorsData ? userSectorsData.map(s => s.sector) : [];
        setSelectedSectors(currentSectors);

        const { data: sectorsData } = await supabase.from('sectors').select('id, name').order('name');
        if (sectorsData) setAvailableSectors(sectorsData);

      } catch (error) {
        console.error("Failed to load profile data:", error);
        toast.error("Failed to load your profile data.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfileData();
  }, [user]);

  // Refresh only suggestions


  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfileData(prevState => ({ ...prevState, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setProfileData(prevState => ({ ...prevState, [name]: value }));
  };

  const handleSectorToggle = (sector: string) => {
    if (sectors.includes(sector)) setSelectedSectors(sectors.filter(s => s !== sector));
    else setSelectedSectors([...sectors, sector]);
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    try {
      setIsSaving(true);
      const { error } = await supabase.from('profiles').update({
        name: profileData.name,
        age: profileData.age ? parseInt(profileData.age) : null,
        experience: profileData.experience,
        risk_tolerance: profileData.riskTolerance,
        profile_completed: true
      }).eq('id', user.id);
      if (error) throw error;

      if (profileData.name !== user.user_metadata?.full_name) {
        await supabase.auth.updateUser({ data: { full_name: profileData.name } });
      }

      await supabase.from('user_sectors').delete().eq('user_id', user.id);
      if (sectors.length > 0) {
        await supabase.from('user_sectors').insert(sectors.map(sector => ({ user_id: user.id, sector })));
      }
      toast.success("Profile updated successfully");

    } catch (error: any) {
      console.error("Failed to update profile:", error);
      toast.error(error.message || "Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <NavigationBar />
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="container mx-auto px-4 py-8 max-w-2xl"> {/* Narrowed container */}
        <h1 className="text-3xl font-bold mb-6 flex items-center gap-2">
          <UserCircle className="h-8 w-8 text-learngreen-600" /> Your Profile
        </h1>

        <div className="space-y-6">
          <Card className="mb-8">
            <CardHeader>
              <div className="flex items-center justify-center mb-4">
                <div className="relative">
                  <Avatar className="h-24 w-24 border-2 border-learngreen-200">
                    <UserCircle className="h-24 w-24 text-gray-400" />
                  </Avatar>
                  <button className="absolute bottom-0 right-0 bg-learngreen-600 text-white p-1.5 rounded-full border-2 border-white">
                    <Camera className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <CardTitle className="text-center">{profileData.name || "Your Name"}</CardTitle>
              <CardDescription className="text-center">{profileData.email}</CardDescription>
            </CardHeader>

            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input id="name" name="name" value={profileData.name} onChange={handleInputChange} disabled={isLoading} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" value={profileData.email} disabled={true} className="bg-gray-50" />
                </div>

                <Separator className="my-4" />

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="age">Age</Label>
                    <Input id="age" name="age" type="number" value={profileData.age} onChange={handleInputChange} disabled={isLoading} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="riskTolerance">Risk Tolerance</Label>
                    <Select value={profileData.riskTolerance} onValueChange={(value) => handleSelectChange("riskTolerance", value)} disabled={isLoading}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Low">Low (Conservative)</SelectItem>
                        <SelectItem value="Medium">Moderate</SelectItem>
                        <SelectItem value="High">High (Aggressive)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="experience">Investment Experience</Label>
                  <Select value={profileData.experience} onValueChange={(value) => handleSelectChange("experience", value)} disabled={isLoading}>
                    <SelectTrigger><SelectValue placeholder="Select experience" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Beginner">Beginner</SelectItem>
                      <SelectItem value="Intermediate">Intermediate</SelectItem>
                      <SelectItem value="Advanced">Advanced / Expert</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label>Sectors of Interest</Label>
                    <Button variant="ghost" size="sm" onClick={() => setShowSectorSelector(!showSectorSelector)} className="h-8 px-2 text-xs">
                      {showSectorSelector ? "Done" : "Edit"}
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {sectors.map((sector) => (
                      <Badge key={sector} variant="secondary">{sector}</Badge>
                    ))}
                  </div>
                  {showSectorSelector && (
                    <div className="mt-2 border rounded-md p-2 bg-gray-50 grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                      {availableSectors.map((sector) => (
                        <div key={sector.id} className="flex items-center space-x-2 cursor-pointer hover:bg-white p-1 rounded" onClick={() => handleSectorToggle(sector.name)}>
                          <div className={`w-4 h-4 border rounded ${sectors.includes(sector.name) ? 'bg-learngreen-600 border-learngreen-600' : 'border-gray-300'}`}>
                            {sectors.includes(sector.name) && <Check className="w-3 h-3 text-white" />}
                          </div>
                          <span className="text-sm">{sector.name}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>

            <CardFooter>
              <Button className="w-full bg-learngreen-600 hover:bg-learngreen-700" onClick={handleSaveProfile} disabled={isSaving || isLoading}>
                {isSaving ? "Saving..." : <><Save className="mr-2 h-4 w-4" /> Save Profile</>}
              </Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader><CardTitle>Account Stats</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between px-2 py-1 bg-gray-50 rounded">
                <span className="text-gray-600">Trading Level</span><span className="font-semibold">Level 3</span>
              </div>
              <div className="flex justify-between px-2 py-1">
                <span className="text-gray-600">Quizzes</span><span className="font-semibold">5 Passed</span>
              </div>
              <div className="flex justify-between px-2 py-1 bg-gray-50 rounded">
                <span className="text-gray-600">Total Return</span><span className="font-semibold text-green-600">+8.75%</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </motion.div>
    </div>
  );
};

export default Profile;
