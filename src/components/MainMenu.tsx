
import { useState } from "react";
import { Link } from "react-router-dom";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import { cn } from "@/lib/utils";
import { BookOpen, ChevronDown, Coins, PieChart, Wrench } from "lucide-react";

const MainMenu = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <NavigationMenu>
      <NavigationMenuList>
        <NavigationMenuItem>
          <NavigationMenuTrigger onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-learngreen-600">
            LearnStocks
          </NavigationMenuTrigger>
          <NavigationMenuContent>
            <ul className="grid w-[320px] gap-3 p-4 md:w-[500px] md:grid-cols-2">
              <li>
                <Link to="/diversification" className={cn(
                  "block select-none space-y-1 rounded-md p-3 hover:bg-learngreen-50 hover:text-learngreen-700"
                )}>
                  <div className="flex items-center">
                    <PieChart className="h-4 w-4 mr-2 text-learngreen-600" />
                    <div className="text-sm font-medium">Portfolio Diversification</div>
                  </div>
                  <p className="text-xs text-gray-500">
                    FDs, Gold, IPOs, NCDs, and Bonds
                  </p>
                </Link>
              </li>
              <li>
                <Link to="/learning" className={cn(
                  "block select-none space-y-1 rounded-md p-3 hover:bg-learngreen-50 hover:text-learngreen-700"
                )}>
                  <div className="flex items-center">
                    <BookOpen className="h-4 w-4 mr-2 text-learngreen-600" />
                    <div className="text-sm font-medium">Learning & Knowledge</div>
                  </div>
                  <p className="text-xs text-gray-500">
                    Courses and Webinars
                  </p>
                </Link>
              </li>
              <li>
                <Link to="/games" className={cn(
                  "block select-none space-y-1 rounded-md p-3 hover:bg-learngreen-50 hover:text-learngreen-700"
                )}>
                  <div className="flex items-center">
                    <Coins className="h-4 w-4 mr-2 text-learngreen-600" />
                    <div className="text-sm font-medium">Games & Quizzes</div>
                  </div>
                  <p className="text-xs text-gray-500">
                    Trade simulators and knowledge challenges
                  </p>
                </Link>
              </li>
              <li>
                <Link to="/settings" className={cn(
                  "block select-none space-y-1 rounded-md p-3 hover:bg-learngreen-50 hover:text-learngreen-700"
                )}>
                  <div className="flex items-center">
                    <Wrench className="h-4 w-4 mr-2 text-learngreen-600" />
                    <div className="text-sm font-medium">Settings</div>
                  </div>
                  <p className="text-xs text-gray-500">
                    Account settings and preferences
                  </p>
                </Link>
              </li>
            </ul>
          </NavigationMenuContent>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  );
};

export default MainMenu;
