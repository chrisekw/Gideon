import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Sparkles } from "lucide-react";

type AnswerBoxProps = {
  isLoading: boolean;
  response: string;
};

export default function AnswerBox({ isLoading, response }: AnswerBoxProps) {
  if (isLoading && !response) {
     return (
        <Card className="shadow-2xl bg-black/50 backdrop-blur-sm border-gray-700 text-white">
            <CardHeader className="py-3">
                <CardTitle className="flex items-center gap-2 text-base text-gray-200">
                <Sparkles className="h-5 w-5 text-primary" />
                AI Analysis
                </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 pb-3">
                <div className="space-y-2 p-1">
                    <Skeleton className="h-4 w-full bg-gray-700/50" />
                    <Skeleton className="h-4 w-4/5 bg-gray-700/50" />
                </div>
            </CardContent>
        </Card>
     )
  }

  if (!response) {
    return null;
  }
  
  return (
    <Card className="shadow-2xl bg-black/50 backdrop-blur-sm border-gray-700 text-white animate-in fade-in duration-500">
      <CardHeader className="py-3">
        <CardTitle className="flex items-center gap-2 text-base text-gray-200">
          <Sparkles className="h-5 w-5 text-primary" />
          AI Analysis
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0 pb-3">
        <div className="max-w-none whitespace-pre-wrap text-sm leading-relaxed text-gray-300">
            {response}
        </div>
      </CardContent>
    </Card>
  );
}
