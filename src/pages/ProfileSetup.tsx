
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";

const ProfileSetup = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [progress, setProgress] = useState(20);
  
  // Profile form data
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [experience, setExperience] = useState<string | undefined>();
  const [riskTolerance, setRiskTolerance] = useState(50); // Slider value 0-100
  const [investmentGoals, setInvestmentGoals] = useState<string[]>([]);
  const [selectedSectors, setSelectedSectors] = useState<string[]>([]);
  const [availableSectors, setAvailableSectors] = useState<{id: string, name: string}[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [userId, setUserId] = useState<string | undefined>();

  // Check if the user is logged in
  useEffect(() => {
    const checkUser = async () => {
      const { data, error } = await supabase.auth.getSession();
      
      if (error || !data.session) {
        navigate("/login");
        return;
      }
      
      setUserId(data.session.user.id);
      
      // Check if profile is already completed
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.session.user.id)
        .single();
        
      if (!profileError && profileData && profileData.profile_completed) {
        navigate("/home");
        return;
      }
      
      // Pre-fill form with existing data if available
      if (profileData) {
        if (profileData.name) setName(profileData.name);
        if (profileData.age) setAge(profileData.age.toString());
        if (profileData.experience) setExperience(profileData.experience);
        if (profileData.risk_tolerance) {
          // Convert risk_tolerance text to slider value
          if (profileData.risk_tolerance === "Low") setRiskTolerance(25);
          else if (profileData.risk_tolerance === "Medium") setRiskTolerance(50);
          else if (profileData.risk_tolerance === "High") setRiskTolerance(75);
        }
        if (profileData.investment_goals) setInvestmentGoals(profileData.investment_goals);
      }
      
      // Get user sectors if available
      const { data: sectorData, error: sectorError } = await supabase
        .from('user_sectors')
        .select('sector')
        .eq('user_id', data.session.user.id);
        
      if (!sectorError && sectorData && sectorData.length > 0) {
        setSelectedSectors(sectorData.map(s => s.sector));
      }
    };
    
    checkUser();
  }, [navigate]);
  
  // Fetch available sectors
  useEffect(() => {
    const fetchSectors = async () => {
      const { data, error } = await supabase
        .from('sectors')
        .select('id, name')
        .order('name');
        
      if (error) {
        console.error("Error fetching sectors:", error);
        return;
      }
      
      if (data) {
        setAvailableSectors(data);
      }
    };
    
    fetchSectors();
  }, []);

  const handleNextStep = () => {
    if (currentStep === 1 && (!name || !age)) {
      toast.error("Please fill out all fields");
      return;
    }

    if (currentStep === 2 && !experience) {
      toast.error("Please select your experience level");
      return;
    }
    
    if (currentStep === 5) {
      handleSubmitProfile();
      return;
    }

    setCurrentStep(currentStep + 1);
    setProgress((currentStep + 1) * 20);
  };

  const handlePreviousStep = () => {
    setCurrentStep(currentStep - 1);
    setProgress((currentStep - 1) * 20);
  };

  const handleInvestmentGoalToggle = (goal: string) => {
    if (investmentGoals.includes(goal)) {
      setInvestmentGoals(investmentGoals.filter(g => g !== goal));
    } else {
      setInvestmentGoals([...investmentGoals, goal]);
    }
  };
  
  const handleSectorToggle = (sector: string) => {
    if (selectedSectors.includes(sector)) {
      setSelectedSectors(selectedSectors.filter(s => s !== sector));
    } else {
      setSelectedSectors([...selectedSectors, sector]);
    }
  };

  const handleSubmitProfile = async () => {
    if (!userId) {
      toast.error("User not authenticated");
      navigate("/login");
      return;
    }
    
    setIsLoading(true);

    try {
      // Update the profile
      const riskToleranceText = riskTolerance < 33 ? "Low" : riskTolerance < 66 ? "Medium" : "High";
      
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          name,
          age: parseInt(age),
          experience,
          risk_tolerance: riskToleranceText,
          investment_goals: investmentGoals,
          profile_completed: true,
          last_login_date: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);
        
      if (profileError) throw profileError;
      
      // Delete existing user sectors and add new ones
      await supabase
        .from('user_sectors')
        .delete()
        .eq('user_id', userId);
        
      // Only insert sectors if any are selected
      if (selectedSectors.length > 0) {
        const sectorsToInsert = selectedSectors.map(sector => ({
          user_id: userId,
          sector
        }));
        
        const { error: sectorError } = await supabase
          .from('user_sectors')
          .insert(sectorsToInsert);
          
        if (sectorError) throw sectorError;
      }
      
      toast.success("Profile setup complete! Welcome to LearnStocks");
      navigate("/home");
    } catch (error: any) {
      console.error("Error saving profile:", error);
      toast.error(error.message || "Failed to save profile");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-learngreen-50 p-4">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle className="text-2xl text-center">Profile Setup</CardTitle>
          <CardDescription className="text-center">
            Help us personalize your experience
          </CardDescription>
          <Progress value={progress} className="mt-4" />
        </CardHeader>
        
        <CardContent>
          {currentStep === 1 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input 
                  id="name" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                  placeholder="Your full name" 
                  required 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="age">Age</Label>
                <Input 
                  id="age" 
                  type="number" 
                  value={age} 
                  onChange={(e) => setAge(e.target.value)} 
                  placeholder="Your age" 
                  min="18" 
                  max="100" 
                  required 
                />
              </div>
            </div>
          )}
          
          {currentStep === 2 && (
            <div className="space-y-4">
              <div>
                <h3 className="font-medium text-lg mb-3">Investment Experience</h3>
                <p className="text-gray-500 mb-4">Select your level of experience in stock market investing</p>
                
                <RadioGroup value={experience} onValueChange={setExperience}>
                  <div className="flex items-center space-x-2 mb-3">
                    <RadioGroupItem value="Beginner" id="beginner" />
                    <Label htmlFor="beginner" className="font-normal">Beginner - New to investing</Label>
                  </div>
                  <div className="flex items-center space-x-2 mb-3">
                    <RadioGroupItem value="Intermediate" id="intermediate" />
                    <Label htmlFor="intermediate" className="font-normal">Intermediate - Some investment experience</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Advanced" id="advanced" />
                    <Label htmlFor="advanced" className="font-normal">Advanced - Experienced investor</Label>
                  </div>
                </RadioGroup>
              </div>
            </div>
          )}
          
          {currentStep === 3 && (
            <div className="space-y-6">
              <div>
                <h3 className="font-medium text-lg mb-3">Risk Tolerance</h3>
                <p className="text-gray-500 mb-4">How much risk are you comfortable taking?</p>
                
                <div className="space-y-4">
                  <Slider
                    defaultValue={[riskTolerance]}
                    max={100}
                    step={1}
                    value={[riskTolerance]}
                    onValueChange={(value) => setRiskTolerance(value[0])}
                    className="mb-2"
                  />
                  <div className="flex justify-between text-sm">
                    <span>Low Risk</span>
                    <span>Medium Risk</span>
                    <span>High Risk</span>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {currentStep === 4 && (
            <div className="space-y-4">
              <h3 className="font-medium text-lg mb-3">Investment Goals</h3>
              <p className="text-gray-500 mb-4">Select all that apply to you</p>
              
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="goal1" 
                    checked={investmentGoals.includes("Wealth Building")} 
                    onCheckedChange={() => handleInvestmentGoalToggle("Wealth Building")} 
                  />
                  <Label htmlFor="goal1" className="font-normal">Long-term wealth building</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="goal2" 
                    checked={investmentGoals.includes("Retirement")} 
                    onCheckedChange={() => handleInvestmentGoalToggle("Retirement")} 
                  />
                  <Label htmlFor="goal2" className="font-normal">Retirement planning</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="goal3" 
                    checked={investmentGoals.includes("Short Term Gains")} 
                    onCheckedChange={() => handleInvestmentGoalToggle("Short Term Gains")} 
                  />
                  <Label htmlFor="goal3" className="font-normal">Short-term gains</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="goal4" 
                    checked={investmentGoals.includes("Learning")} 
                    onCheckedChange={() => handleInvestmentGoalToggle("Learning")} 
                  />
                  <Label htmlFor="goal4" className="font-normal">Learning about investments</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="goal5" 
                    checked={investmentGoals.includes("Other")} 
                    onCheckedChange={() => handleInvestmentGoalToggle("Other")} 
                  />
                  <Label htmlFor="goal5" className="font-normal">Other goals</Label>
                </div>
              </div>
            </div>
          )}
          
          {currentStep === 5 && (
            <div className="space-y-4">
              <h3 className="font-medium text-lg mb-3">Sectors of Interest</h3>
              <p className="text-gray-500 mb-4">Select sectors you're interested in investing</p>
              
              <div className="flex flex-wrap gap-2 mb-4">
                {selectedSectors.length > 0 ? (
                  selectedSectors.map((sector) => (
                    <Badge key={sector} variant="secondary" className="cursor-pointer" onClick={() => handleSectorToggle(sector)}>
                      {sector} ✕
                    </Badge>
                  ))
                ) : (
                  <p className="text-sm text-gray-500">No sectors selected</p>
                )}
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                {availableSectors.map((sector) => (
                  <div key={sector.id} className="flex items-center space-x-2">
                    <Checkbox 
                      id={`sector-${sector.id}`} 
                      checked={selectedSectors.includes(sector.name)} 
                      onCheckedChange={() => handleSectorToggle(sector.name)} 
                    />
                    <Label htmlFor={`sector-${sector.id}`} className="font-normal">{sector.name}</Label>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
        
        <CardFooter className="flex justify-between">
          <Button 
            variant="outline" 
            onClick={handlePreviousStep}
            disabled={currentStep === 1}
          >
            Back
          </Button>
          <Button 
            onClick={handleNextStep}
            className="bg-learngreen-600 hover:bg-learngreen-700"
            disabled={isLoading}
          >
            {currentStep === 5 
              ? (isLoading ? "Setting Up Your Account..." : "Complete Setup")
              : "Continue"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default ProfileSetup;
