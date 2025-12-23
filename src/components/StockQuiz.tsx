import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Quiz, QuizQuestion } from "@/types";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface StockQuizProps {
  quiz: Quiz;
  onComplete: (score: number) => void;
}

const StockQuiz = ({ quiz, onComplete }: StockQuizProps) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0); // used only for display ordering
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [answeredCorrectly, setAnsweredCorrectly] = useState<boolean | null>(null);
  const [score, setScore] = useState(0);
  const [finalScore, setFinalScore] = useState(0);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Adaptive quiz state
  const [askedIds, setAskedIds] = useState<string[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<QuizQuestion | null>(null);
  const [currentDifficulty, setCurrentDifficulty] = useState<"Easy" | "Medium" | "Difficult">("Easy");

  // --- FIX 2: This is the number of questions to ASK (e.g., 5) ---
  // We check for the custom 'totalQuestionsToAsk' prop you'll add to the quiz object.
  // We default to the full array length for backward compatibility.
  const totalQuestions = (quiz as any).totalQuestionsToAsk || quiz.questions.length;
  
  // Build pools grouped by difficulty for selection
  const buildPools = () => {
    const pools: Record<string, QuizQuestion[]> = { Easy: [], Medium: [], Difficult: [] };
    
    // --- FIX 2: This now uses the FULL quiz.questions array (e.g., all 100) ---
    // This ensures the pools are fully populated.
    quiz.questions.forEach((q) => {
      const d = (q as any).difficulty || "Medium"; // default to Medium if missing
      if (!pools[d]) pools[d] = [];
      pools[d].push(q);
    });
    return pools as Record<"Easy" | "Medium" | "Difficult", QuizQuestion[]>;
  };

  const pools = buildPools();

  // Initialize first question when component mounts
  useEffect(() => {
    if (currentQuestion) return;
    const first = pickNextQuestion(currentDifficulty, askedIds) || quiz.questions[0] || null;
    
    if (first) {
      setCurrentQuestion(first);
      // --- FIX 1: Set difficulty based on the *actual* first question ---
      const actualDifficulty = (first as any).difficulty || "Medium";
      setCurrentDifficulty(actualDifficulty);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  const { user } = useAuth();
  
  // --- FIX 2: Progress is based on totalQuestions (e.g., 5) ---
  const progress = ((askedIds.length + (quizCompleted ? 0 : (currentQuestion ? 1 : 0))) / totalQuestions) * 100;
  
  // Check if this is the daily basics quiz
  const isDailyBasics = quiz.id === "basics";
  const today = new Date().toDateString();
  const completedToday = user ? localStorage.getItem(`quiz_completed_basics_${today}_${user.id}`) === "true" : false;
  
  const handleSelectOption = (index: number) => {
    if (answeredCorrectly !== null) return; // Don't allow changing after answering
    setSelectedOption(index);
  };
  
  const handleCheckAnswer = () => {
    if (selectedOption === null) return;
    if (!currentQuestion) return;

    const isCorrect = selectedOption === currentQuestion.correctOption;
    setAnsweredCorrectly(isCorrect);
  };
  
  const handleNextQuestion = () => {
    // Update score
    const gained = answeredCorrectly ? 1 : 0;
    const newScore = score + gained;
    setScore(newScore);

    // mark current question as asked (use local copy so we can compute next question deterministically)
    const newAskedIds = currentQuestion ? [...askedIds, currentQuestion.id] : [...askedIds];
    setAskedIds(newAskedIds);

    // --- FIX 1: This logic is all correct ---
    // 1. Determine the TARGET difficulty using local var
    let targetDifficulty: "Easy" | "Medium" | "Difficult" = currentDifficulty;
    // Easy: correct -> Medium, incorrect -> stay Easy
    // Medium: correct -> Difficult, incorrect -> Easy
    // Difficult: correct -> stay Difficult, incorrect -> Medium
    if (currentDifficulty === "Easy") {
      targetDifficulty = answeredCorrectly ? "Medium" : "Easy";
    } else if (currentDifficulty === "Medium") {
      targetDifficulty = answeredCorrectly ? "Difficult" : "Easy";
    } else if (currentDifficulty === "Difficult") {
      targetDifficulty = answeredCorrectly ? "Difficult" : "Medium";
    }
    
    // Clear selected option & answered flag for next question
    setSelectedOption(null);
    setAnsweredCorrectly(null);

    // --- FIX 2: Check completion against totalQuestions (e.g., 5) ---
    const answeredCount = newAskedIds.length;
    if (answeredCount >= totalQuestions) {
      setFinalScore(newScore);
      setQuizCompleted(true);
      processQuizCompletion(newScore);
      return;
    }

    // 2. pick next question based on computed targetDifficulty
    // The pools are now full (e.g., 100 questions), so this will work.
    let nextQuestion = pickNextQuestion(targetDifficulty, newAskedIds);
    
    if (!nextQuestion) {
      // fallback: find any unasked question from the full list
      nextQuestion = quiz.questions.find((q) => !newAskedIds.includes(q.id) && q.id !== currentQuestion?.id) || null;
    }

    // --- FIX 1: Set state based on the ACTUAL question that was picked ---
    if (nextQuestion) {
      setCurrentQuestion(nextQuestion);
      
      // Update the difficulty state to match the *actual* question we just picked.
      const actualDifficulty = (nextQuestion as any).difficulty || "Medium";
      setCurrentDifficulty(actualDifficulty);

      setCurrentQuestionIndex((i) => i + 1);
    } else {
      // no more questions
      setFinalScore(newScore);
      setQuizCompleted(true);
      processQuizCompletion(newScore);
    }
  };

  // Pick next question by prioritized difficulty order (prefer target, then sensible neighbors)
  // This function is correct. It now searches the full pools.
  const pickNextQuestion = (difficulty: "Easy" | "Medium" | "Difficult", alreadyAsked: string[]) => {
    const orderMap: Record<string, ("Easy" | "Medium" | "Difficult")[]> = {
      Easy: ["Easy", "Medium", "Difficult"],
      Medium: ["Medium", "Easy", "Difficult"],
      Difficult: ["Difficult", "Medium", "Easy"],
    };

    const order = orderMap[difficulty] || ["Medium", "Easy", "Difficult"];

    for (const d of order) {
      const pool = pools[d] || [];
      const candidates = pool.filter((q) => !alreadyAsked.includes(q.id) && q.id !== currentQuestion?.id);
      if (candidates.length > 0) {
        const idx = Math.floor(Math.random() * candidates.length);
        return candidates[idx];
      }
    }

    return null;
  };
  
  const processQuizCompletion = async (totalScore: number) => {
    const calculatedScore = calculateFinalScore(totalScore);
    setIsProcessing(true);
    
    try {
      // Mark daily quiz as completed
      if (isDailyBasics && user) {
        localStorage.setItem(`quiz_completed_basics_${today}_${user.id}`, "true");
      }
      
      // Update the user's points in the database using the RPC function
      if (user) {
        const { data, error } = await supabase.rpc('increment_points', {
          amount: calculatedScore.points
        });
          
        if (error) {
          console.error("Error updating points:", error);
          toast.error("Failed to add points to your account");
        } else {
          toast.success(`${calculatedScore.points} points added to your account!`);
        }
      }
    } catch (err) {
      console.error("Error processing quiz completion:", err);
      toast.error("Failed to process quiz results");
    } finally {
      setIsProcessing(false);
      onComplete(totalScore);
    }
  };
  
  const calculateFinalScore = (totalScore: number) => {
    // --- FIX 2: Calculate percentage based on totalQuestions (e.g., 5) ---
    const percentage = (totalScore / totalQuestions) * 100;
    return {
      correct: totalScore,
      total: totalQuestions, // Use totalQuestions here
      percentage: percentage.toFixed(0),
      points: Math.round((percentage / 100) * quiz.points)
    };
  };
  
  return (
    <div className="w-full max-h-[70vh] overflow-y-auto">
      <Card className="w-full">
        {!quizCompleted ? (
        <>
          <CardHeader>
            <CardTitle>{quiz.title}</CardTitle>
            {currentQuestion && (
              <div className="text-sm text-gray-600">Difficulty: {((currentQuestion as any).difficulty) || currentDifficulty}</div>
            )}
            {isDailyBasics && (
              <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mb-2">
                <p className="text-sm text-blue-700">
                  {/* --- FIX 2: Update text to use totalQuestions --- */}
                  🌟 Daily Challenge: {totalQuestions} questions selected just for you today!
                </p>
              </div>
            )}
            <div className="flex justify-between items-center">
              {/* --- FIX 2: Update text to use totalQuestions --- */}
              <span className="text-sm">Question {currentQuestionIndex + 1} of {totalQuestions}</span>
              <span className="text-sm">Score: {score + (answeredCorrectly ? 1 : 0)}</span>
            </div>
            <Progress value={progress} className="mt-2" />
          </CardHeader>
          
          <CardContent>
            <div className="space-y-4">
              <h3 className="font-medium text-lg">{currentQuestion?.text}</h3>
              
              <RadioGroup value={selectedOption?.toString()} className="space-y-2">
                {currentQuestion?.options.map((option, index) => (
                  <div
                    key={index}
                    className={cn(
                      "flex items-center space-x-2 border p-3 rounded-md cursor-pointer",
                      selectedOption === index && answeredCorrectly === null && "border-learngreen-400 bg-learngreen-50",
                      answeredCorrectly !== null && index === currentQuestion.correctOption && "border-green-400 bg-green-50",
                      answeredCorrectly === false && selectedOption === index && "border-red-400 bg-red-50"
                    )}
                    onClick={() => handleSelectOption(index)}
                  >
                    <RadioGroupItem 
                      value={index.toString()} 
                      checked={selectedOption === index}
                      id={`option-${index}`}
                    />
                    <Label htmlFor={`option-${index}`} className="font-normal flex-1 cursor-pointer">
                      {option}
                    </Label>
                    {answeredCorrectly !== null && index === currentQuestion.correctOption && (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    )}
                    {answeredCorrectly === false && selectedOption === index && (
                      <XCircle className="h-5 w-5 text-red-500" />
                    )}
                  </div>
                ))}
              </RadioGroup>
              
              {answeredCorrectly !== null && (
                <div className={cn(
                  "p-3 rounded-md",
                  answeredCorrectly ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
                )}>
                  <p className="font-medium mb-1">
                    {answeredCorrectly ? "Correct!" : "Incorrect!"}
                  </p>
                  <p className="text-sm">{currentQuestion?.explanation}</p>
                </div>
              )}
            </div>
          </CardContent>
          
          <CardFooter className="flex justify-end space-x-4">
            {answeredCorrectly === null ? (
              <Button 
                onClick={handleCheckAnswer}
                className="bg-learngreen-600 hover:bg-learngreen-700"
                disabled={selectedOption === null}
              >
                Check Answer
              </Button>
            ) : (
              <Button 
                onClick={handleNextQuestion}
                className="bg-learngreen-600 hover:bg-learngreen-700"
              >
                {/* --- FIX 2: Update text to use totalQuestions --- */}
                {currentQuestionIndex < totalQuestions - 1 ? "Next Question" : "Finish Quiz"}
              </Button>
            )}
          </CardFooter>
        </>
      ) : (
        <>
          <CardHeader>
            <CardTitle>Quiz Completed!</CardTitle>
          </CardHeader>
          
          <CardContent>
            <div className="text-center space-y-4">
              <div className="mb-4">
                <div className="text-6xl font-bold text-learngreen-600 mb-2">
                  {calculateFinalScore(finalScore).percentage}%
                </div>
                <p className="text-xl">
                  {/* --- FIX 2: Update text to use totalQuestions --- */}
                  You got {finalScore} out of {totalQuestions} questions right
                </p>
              </div>
              
              <div className="p-4 bg-learngreen-50 rounded-md">
                <p className="font-medium text-learngreen-700">
                  You earned {calculateFinalScore(finalScore).points} points!
                </p>
                {isDailyBasics && (
                  <p className="text-sm text-learngreen-600 mt-1">
                    {/* --- FIX 2: Update text to use totalQuestions --- */}
                    Come back tomorrow for {totalQuestions} new questions! 📅
                  </p>
                )}
              </div>
            </div>
          </CardContent>
          
          <CardFooter className="flex justify-center">
            <Button 
              onClick={() => window.location.reload()}
              variant="outline"
              className="mr-2"
              disabled={isProcessing}
            >
              Try Again
            </Button>
            <Button
              className="bg-learngreen-600 hover:bg-learngreen-700"
              onClick={() => window.location.href = '/games'}
              disabled={isProcessing}
            >
              Back to Games
            </Button>
          </CardFooter>
        </>
      )}
    </Card>
    </div>
  );
};

export default StockQuiz;