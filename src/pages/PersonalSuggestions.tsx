
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import { toast } from "sonner";
import { Sparkles, RefreshCw, BarChart } from "lucide-react";
import NavigationBar from "@/components/NavigationBar";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { StockSuggestion, UserProfile } from "@/types";
import { getPersonalizedSuggestions } from "@/utils/psgLogic";
import useLivePrices from "@/hooks/useLivePrices";

const PersonalSuggestions = () => {
    const { user } = useAuth();
    const [isLoading, setIsLoading] = useState(false);

    // Suggestions State
    const [suggestions, setSuggestions] = useState<StockSuggestion[]>([]);
    const [marketPref, setMarketPref] = useState<"Global" | "US" | "India">("Global");
    const [isRefreshing, setIsRefreshing] = useState(false);

    const { fetchPrices } = useLivePrices([], 0); // Manual fetch only

    const updateSuggestionsWithLivePrices = async (initialSuggestions: StockSuggestion[]) => {
        if (initialSuggestions.length === 0) return initialSuggestions;
        try {
            const symbolsToFetch = initialSuggestions.map(s => {
                const isIndian = s.symbol.length > 5 || ["TCS", "ITC", "SBIN", "LT", "INFY"].includes(s.symbol) || marketPref === "India";
                return isIndian && !s.symbol.includes(".") ? `${s.symbol}.NS` : s.symbol;
            });
            const priceMap = await fetchPrices(symbolsToFetch);
            return initialSuggestions.map(s => {
                const lookupSymbol = s.symbol.length > 5 || ["TCS", "ITC", "SBIN", "LT", "INFY"].includes(s.symbol) || marketPref === "India" ? `${s.symbol}.NS` : s.symbol;
                const liveData = priceMap[lookupSymbol] || priceMap[s.symbol];
                if (liveData) {
                    return {
                        ...s,
                        currentPrice: liveData.price,
                        reason: liveData.changePercent ? `${s.reason} (Day: ${liveData.changePercent > 0 ? '+' : ''}${liveData.changePercent.toFixed(2)}%)` : s.reason
                    };
                }
                return s;
            });
        } catch (e) {
            console.error("Failed to fetch live prices for suggestions", e);
            return initialSuggestions;
        }
    };

    const handleRefreshSuggestions = async () => {
        if (!user) return;
        setIsLoading(true); // Show local loading state for this action too if needed, or stick to isRefreshing
        setIsRefreshing(true);

        try {
            // Fetch fresh profile data to ensure logic uses latest params
            const { data: profileData } = await supabase.from('profiles').select('*').eq('id', user.id).single();
            const { data: sectorData } = await supabase.from('user_sectors').select('sector').eq('user_id', user.id);
            const sectors = sectorData ? sectorData.map(s => s.sector) : [];

            const tempProfile: UserProfile = {
                id: user.id,
                name: user.user_metadata?.full_name || "",
                age: (profileData?.age as number) || 0,
                experience: (profileData?.experience as any) || 'Beginner',
                riskTolerance: (profileData?.risk_tolerance as any) || 'Low',
                investmentGoals: [],
                points: 0,
                lastLoginDate: new Date().toISOString(),
                portfolioValue: 0,
                email: user.email || "",
                sectorPreferences: sectors
            };

            const content = getPersonalizedSuggestions(tempProfile, marketPref);
            const liveContent = await updateSuggestionsWithLivePrices(content);
            setSuggestions(liveContent);
            toast.success("Suggestions updated");
        } catch (e) {
            console.error(e);
            toast.error("Failed to refresh suggestions");
        } finally {
            setIsRefreshing(false);
            setIsLoading(false);
        }
    };

    useEffect(() => {
        handleRefreshSuggestions();
    }, [user, marketPref]);

    return (
        <div className="min-h-screen bg-gray-50">
            <NavigationBar />
            <div className="container mx-auto px-4 py-8">

                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                            <Sparkles className="h-8 w-8 text-yellow-500" />
                            Personalized Suggestions
                        </h1>
                        <p className="text-gray-600 mt-1">AI-curated investment ideas tailored to your risk profile.</p>
                    </div>

                    <div className="flex items-center gap-2 bg-white p-2 rounded-lg shadow-sm border">
                        <span className="text-sm font-medium text-gray-600 ml-2">Market:</span>
                        <Select value={marketPref} onValueChange={(v: any) => setMarketPref(v)}>
                            <SelectTrigger className="w-[120px] h-9">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Global">Global</SelectItem>
                                <SelectItem value="India">India</SelectItem>
                                <SelectItem value="US">USA</SelectItem>
                            </SelectContent>
                        </Select>
                        <Button variant="ghost" size="icon" onClick={handleRefreshSuggestions} disabled={isRefreshing}>
                            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                        </Button>
                    </div>
                </div>

                {/* Suggestions Grid */}
                {suggestions.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {suggestions.map((s, i) => (
                            <Card key={i} className="hover:shadow-lg transition-shadow border-t-4 border-t-learngreen-500">
                                <CardHeader className="pb-2">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <CardTitle className="flex items-center gap-2 text-xl">
                                                {s.symbol} <Badge variant="outline" className="font-normal">{s.riskLevel}</Badge>
                                            </CardTitle>
                                            <CardDescription className="text-sm mt-1">{s.name}</CardDescription>
                                        </div>
                                        <div className="text-right">
                                            <div className="font-bold text-lg">{marketPref === "India" ? "₹" : "$"}{s.currentPrice.toFixed(2)}</div>
                                            <div className={`text-xs font-bold ${s.potentialGain && s.potentialGain > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                {s.potentialGain ? `+${(s.potentialGain * 100).toFixed(1)}% Est.` : "N/A"}
                                            </div>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm italic text-gray-600 bg-gray-50 p-3 rounded mb-4 border border-dashed">
                                        <Sparkles className="inline w-3 h-3 mr-1 text-yellow-500" />{s.reason}
                                    </p>
                                    <div className="space-y-1.5">
                                        <div className="flex justify-between text-xs text-gray-500 font-medium">
                                            <span>AI Confidence Match</span>
                                            <span>{Math.min(s.score, 100)}%</span>
                                        </div>
                                        <Progress value={Math.min(s.score, 100)} className="h-2" />
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-16 bg-white rounded-xl border-2 border-dashed">
                        <BarChart className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900">No Suggestions Found</h3>
                        <p className="text-gray-500 max-w-sm mx-auto mt-2">
                            {isLoading ? "Loading your personalized picks..." : "Try updating your profile risk tolerance or sector preferences to get new ideas."}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PersonalSuggestions;
