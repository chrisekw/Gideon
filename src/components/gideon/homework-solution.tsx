
"use client";

import Image from "next/image";

type HomeworkSolutionProps = {
  solution: string;
  diagramUrl?: string | null;
};

const renderWithMarkdown = (text: string) => {
    // Basic markdown for bold text **text**
    const parts = text.split(/\*\*(.*?)\*\*/g);
    return parts.map((part, i) =>
      i % 2 === 1 ? <strong key={i}>{part}</strong> : part
    );
};

export default function HomeworkSolution({ solution, diagramUrl }: HomeworkSolutionProps) {
  // Split solution into steps. Handles numbered lists and paragraphs.
  const steps = solution.split('\n').filter(line => line.trim() !== '');

  return (
    <div className="space-y-6">
      {diagramUrl && (
        <div className="space-y-2">
            <h4 className="font-semibold">Diagram</h4>
            <div className="relative aspect-video w-full rounded-lg overflow-hidden border">
                <Image src={diagramUrl} alt="Solution Diagram" fill className="object-contain" />
            </div>
        </div>
      )}
      <div className="space-y-2">
        <h4 className="font-semibold">Step-by-step Solution</h4>
        <div className="space-y-4">
          {steps.map((step, index) => (
            <div key={index} className="flex items-start gap-4 p-4 rounded-lg bg-secondary/50">
              <div className="flex-shrink-0 flex items-center justify-center h-7 w-7 rounded-full bg-primary text-primary-foreground text-sm font-bold mt-0.5">
                {index + 1}
              </div>
              <div className="flex-grow text-sm leading-relaxed">
                {renderWithMarkdown(step.replace(/^\d+\.\s*/, ''))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
