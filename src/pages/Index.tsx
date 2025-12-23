
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, BarChart3, PiggyBank, Trophy, BookOpen } from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-learngreen-50">
      {/* Hero Section */}
      <div className="container mx-auto px-4 pt-16 pb-24 text-center">
        <h1 className="text-4xl md:text-6xl font-bold text-learngreen-700 mb-6">
          Learn Stock Trading <span className="text-learngreen-500">Without Risking Real Money</span>
        </h1>
        <p className="text-xl md:text-2xl text-gray-600 mb-10 max-w-3xl mx-auto">
          Build your investment skills with virtual trading, educational games, and personalized stock suggestions.
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Link to="/login">
            <Button size="lg" className="bg-learngreen-600 hover:bg-learngreen-700 text-white">
              Start Trading Now
            </Button>
          </Link>
          <Link to="/about">
            <Button size="lg" variant="outline" className="border-learngreen-600 text-learngreen-600">
              Learn More
            </Button>
          </Link>
        </div>
      </div>

      {/* Features Section */}
      <div className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-semibold text-center text-gray-800 mb-12">
          Why Choose LearnStocks
        </h2>
        
        <div className="grid md:grid-cols-3 gap-8">
          <Card className="border-learngreen-100">
            <CardContent className="pt-6">
              <div className="flex justify-center mb-4">
                <div className="p-3 rounded-full bg-learngreen-100">
                  <PiggyBank className="h-8 w-8 text-learngreen-600" />
                </div>
              </div>
              <h3 className="text-xl font-semibold text-center mb-2">Virtual Portfolio</h3>
              <p className="text-gray-600 text-center">
                Start with ₹10,000 virtual money and build your investment portfolio without risk.
              </p>
            </CardContent>
          </Card>
          
          <Card className="border-learngreen-100">
            <CardContent className="pt-6">
              <div className="flex justify-center mb-4">
                <div className="p-3 rounded-full bg-learngreen-100">
                  <TrendingUp className="h-8 w-8 text-learngreen-600" />
                </div>
              </div>
              <h3 className="text-xl font-semibold text-center mb-2">Real-Time Data</h3>
              <p className="text-gray-600 text-center">
                Practice with real Indian stock market data for an authentic learning experience.
              </p>
            </CardContent>
          </Card>
          
          <Card className="border-learngreen-100">
            <CardContent className="pt-6">
              <div className="flex justify-center mb-4">
                <div className="p-3 rounded-full bg-learngreen-100">
                  <Trophy className="h-8 w-8 text-learngreen-600" />
                </div>
              </div>
              <h3 className="text-xl font-semibold text-center mb-2">Fun Games & Rewards</h3>
              <p className="text-gray-600 text-center">
                Play stock market games, take quizzes, and earn additional points to boost your portfolio.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* How it Works Section */}
      <div className="bg-white py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-semibold text-center text-gray-800 mb-12">
            How It Works
          </h2>
          
          <div className="grid md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-learngreen-500 text-white font-bold text-xl mb-4">
                1
              </div>
              <h3 className="text-xl font-medium mb-2">Sign Up</h3>
              <p className="text-gray-600">Create your account and complete your investor profile</p>
            </div>
            
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-learngreen-500 text-white font-bold text-xl mb-4">
                2
              </div>
              <h3 className="text-xl font-medium mb-2">Get Virtual Money</h3>
              <p className="text-gray-600">Receive ₹10,000 points to start investing</p>
            </div>
            
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-learngreen-500 text-white font-bold text-xl mb-4">
                3
              </div>
              <h3 className="text-xl font-medium mb-2">Start Trading</h3>
              <p className="text-gray-600">Buy and sell stocks with your virtual portfolio</p>
            </div>
            
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-learngreen-500 text-white font-bold text-xl mb-4">
                4
              </div>
              <h3 className="text-xl font-medium mb-2">Learn & Earn</h3>
              <p className="text-gray-600">Play games and take quizzes to earn more points</p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-learngreen-500 py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-6">
            Ready to Start Your Investment Journey?
          </h2>
          <p className="text-xl text-white mb-8 max-w-2xl mx-auto">
            Join thousands of users learning to invest in the stock market without risking real money.
          </p>
          <Link to="/login">
            <Button size="lg" className="bg-white text-learngreen-600 hover:bg-learngreen-50">
              Create Free Account
            </Button>
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-100 py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <p className="text-gray-600">© 2025 LearnStocks. All rights reserved.</p>
            </div>
            <div className="flex space-x-4">
              <Link to="/terms" className="text-gray-600 hover:text-learngreen-600">Terms of Service</Link>
              <Link to="/privacy" className="text-gray-600 hover:text-learngreen-600">Privacy Policy</Link>
              <Link to="/contact" className="text-gray-600 hover:text-learngreen-600">Contact Us</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
