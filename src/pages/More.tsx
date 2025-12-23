
import React from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { 
  LogOut, 
  UserCircle, 
  Settings, 
  HelpCircle, 
  Info, 
  CreditCard, 
  Heart, 
  Shield, 
  Bell, 
  ChevronRight,
} from "lucide-react";
import { Link } from "react-router-dom";
import NavigationBar from "@/components/NavigationBar";
import ResourceSection from "@/components/ResourceSection";

const More = () => {
  const { user, signOut } = useAuth();
  
  const handleSignOut = async () => {
    await signOut();
  };
  
  return (
    <div className="min-h-screen bg-gray-50">
      <NavigationBar />
      <div className="container mx-auto px-4 py-8 max-w-md">
        <h1 className="text-2xl font-bold mb-6">Profile & Settings</h1>
        
        {/* User Profile Card */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="flex items-center">
              <Avatar className="h-16 w-16 mr-4">
                <UserCircle className="h-16 w-16 text-gray-400" />
              </Avatar>
              <div>
                <h2 className="text-xl font-semibold">{user?.user_metadata?.full_name || "User"}</h2>
                <p className="text-sm text-gray-500">{user?.email}</p>
              </div>
            </div>
            <div className="mt-4">
              <Link to="/profile" className="w-full">
                <Button variant="outline" className="w-full justify-between">
                  Edit Profile
                  <ChevronRight size={18} />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
        
        {/* Portfolio Diversification Section (External Resources) */}
        <ResourceSection
          title="Portfolio Diversification"
          items={[
            { label: "Fixed Deposits", href: "https://www.hdfcbank.com/personal/resources/learning-centre/savings-and-investments/what-is-fixed-deposit" },
            { label: "Gold Investments", href: "https://www.mygov.in/mygold/" },
            { label: "IPOs", href: "https://www.chittorgarh.com/report/ipo-dashboard-live-ipo-gmp/92/" },
            { label: "NCDs", href: "https://www.chittorgarh.com/report/ncd-public-issues-in-india/59/" },
            { label: "Bonds", href: "https://www.rbi.org.in/Scripts/BS_ViewBonds.aspx" },
          ]}
        />

        {/* Learning & Knowledge Section (External Resources) */}
        <div className="mt-8">
          <ResourceSection
            title="Learning & Knowledge"
            items={[
              { label: "Courses", href: "https://zerodha.com/varsity/" },
              { label: "Webinars", href: "https://www.nseindia.com/learn/nse-academy" },
            ]}
          />
        </div>
        
        {/* Account Settings */}
        <h2 className="text-lg font-semibold mb-3">Account Settings</h2>
        <Card className="mb-8">
          <CardContent className="p-0">
            <div className="divide-y">
              <Link to="/settings/personal" className="flex items-center justify-between p-4 hover:bg-gray-50">
                <div className="flex items-center">
                  <UserCircle className="h-5 w-5 mr-3 text-learngreen-600" />
                  <span>Personal Information</span>
                </div>
                <ChevronRight size={18} className="text-gray-400" />
              </Link>
              
              <Link to="/settings/account" className="flex items-center justify-between p-4 hover:bg-gray-50">
                <div className="flex items-center">
                  <Settings className="h-5 w-5 mr-3 text-learngreen-600" />
                  <span>Account Settings</span>
                </div>
                <ChevronRight size={18} className="text-gray-400" />
              </Link>
              
              <Link to="/settings/notifications" className="flex items-center justify-between p-4 hover:bg-gray-50">
                <div className="flex items-center">
                  <Bell className="h-5 w-5 mr-3 text-learngreen-600" />
                  <span>Notification Preferences</span>
                </div>
                <ChevronRight size={18} className="text-gray-400" />
              </Link>
              
              <Link to="/settings/privacy" className="flex items-center justify-between p-4 hover:bg-gray-50">
                <div className="flex items-center">
                  <Shield className="h-5 w-5 mr-3 text-learngreen-600" />
                  <span>Privacy & Security</span>
                </div>
                <ChevronRight size={18} className="text-gray-400" />
              </Link>
            </div>
          </CardContent>
        </Card>
        
        {/* App Information */}
        <h2 className="text-lg font-semibold mb-3">App Information</h2>
        <Card className="mb-8">
          <CardContent className="p-0">
            <div className="divide-y">
              <Link to="/help" className="flex items-center justify-between p-4 hover:bg-gray-50">
                <div className="flex items-center">
                  <HelpCircle className="h-5 w-5 mr-3 text-learngreen-600" />
                  <span>Help & Support</span>
                </div>
                <ChevronRight size={18} className="text-gray-400" />
              </Link>
              
              <Link to="/about" className="flex items-center justify-between p-4 hover:bg-gray-50">
                <div className="flex items-center">
                  <Info className="h-5 w-5 mr-3 text-learngreen-600" />
                  <span>About LearnStocks</span>
                </div>
                <ChevronRight size={18} className="text-gray-400" />
              </Link>
              
              <Link to="/terms" className="flex items-center justify-between p-4 hover:bg-gray-50">
                <div className="flex items-center">
                  <CreditCard className="h-5 w-5 mr-3 text-learngreen-600" />
                  <span>Terms & Conditions</span>
                </div>
                <ChevronRight size={18} className="text-gray-400" />
              </Link>
              
              <Link to="/feedback" className="flex items-center justify-between p-4 hover:bg-gray-50">
                <div className="flex items-center">
                  <Heart className="h-5 w-5 mr-3 text-learngreen-600" />
                  <span>Give Feedback</span>
                </div>
                <ChevronRight size={18} className="text-gray-400" />
              </Link>
            </div>
          </CardContent>
        </Card>
        
        {/* Achievements Section */}
        <h2 className="text-lg font-semibold mb-3">Your Achievements</h2>
        <Card className="mb-8">
          <CardContent className="py-4">
            <div className="flex items-center justify-between mb-4">
              <span className="font-medium">Trading Level</span>
              <span className="px-2 py-1 bg-learngreen-100 text-learngreen-700 rounded-full text-sm">Level 3</span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="font-medium">Learning Progress</span>
              <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">42% Complete</span>
            </div>
          </CardContent>
        </Card>
        
        {/* Sign Out Button */}
        <Button 
          variant="destructive" 
          className="w-full mb-8" 
          onClick={handleSignOut}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Sign Out
        </Button>
        
        {/* App version */}
        <p className="text-center text-gray-500 text-sm">
          LearnStocks v1.0.0
        </p>
      </div>
    </div>
  );
};

export default More;
