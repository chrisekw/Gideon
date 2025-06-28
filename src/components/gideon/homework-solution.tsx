
"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight } from "lucide-react";

type HomeworkSolutionProps = {
  solution: {
    question: string;
    solution: string;
    diagramUrl?: string | null;
  };
};

const renderWithMarkdown = (text: string) => {
  if (!text) return null;
  // Basic markdown for bold text **text**
  const parts = text.split(/\*\*(.*?)\*\*/g);
  return parts.map((part, i) =>
    i % 2 === 1 ? <strong key={i}>{part}</strong> : part
  );
};

export default function HomeworkSolution({ solution }: HomeworkSolutionProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const steps = solution.solution.split('\n').filter(line => line.trim() !== '');

  useEffect(() => {
    setCurrentStep(0);
  }, [solution]);

  return (
    <div className="space-y-6">
       <h3 className="font-bold text-lg text-primary">{solution.question}</h3>

      {solution.diagramUrl && (
        <div className="space-y-2 animate-in fade-in">
            <h4 className="font-semibold">Diagram</h4>
            <div className="relative aspect-video w-full rounded-lg overflow-hidden border">
                <Image src={solution.diagramUrl} alt="Solution Diagram" fill className="object-contain" />
            </div>
        </div>
      )}

      <div className="space-y-4">
        <h4 className="font-semibold">Step-by-step Solution</h4>
        
        <div className="p-4 rounded-lg bg-secondary/50 min-h-[6rem]">
          <div className="flex-grow text-sm leading-relaxed whitespace-pre-wrap">
            {steps.length > 0 ? renderWithMarkdown(steps[currentStep].replace(/^\d+\.\s*/, '')) : "No solution steps provided."}
          </div>
        </div>

        {steps.length > 1 && (
            <div className="flex items-center justify-between">
                <Button variant="outline" size="sm" onClick={() => setCurrentStep(prev => prev - 1)} disabled={currentStep === 0}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Previous
                </Button>
                <div className="text-sm font-medium text-muted-foreground">
                    Step {currentStep + 1} of {steps.length}
                </div>
                <Button variant="outline" size="sm" onClick={() => setCurrentStep(prev => prev + 1)} disabled={currentStep === steps.length - 1}>
                    Next
                    <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
            </div>
        )}
      </div>
    </div>
  );
}
