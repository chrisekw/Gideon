
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Sparkles } from "lucide-react";

type AnswerBoxProps = {
  isLoading: boolean;
  response: string;
};

export default function AnswerBox({ isLoading, response }: AnswerBoxProps) {
  return (
    <Card className="shadow-2xl bg-gray-900/80 backdrop-blur-sm border-gray-700 text-white">
      <CardHeader className="py-4">
        <CardTitle className="flex items-center gap-2 font-headline text-base text-gray-200">
          <Sparkles className="h-5 w-5 text-accent" />
          AI Analysis
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0 pb-4">
        {isLoading ? (
          <div className="space-y-3 p-1">
            <Skeleton className="h-4 w-full bg-gray-700/50" />
            <Skeleton className="h-4 w-full bg-gray-700/50" />
            <Skeleton className="h-4 w-3/4 bg-gray-700/50" />
          </div>
        ) : (
          <div className="max-w-none whitespace-pre-wrap text-sm leading-relaxed text-gray-300">
            {response}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
