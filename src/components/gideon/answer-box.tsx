
"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Sparkles, Volume2, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { textToSpeech } from "@/ai/flows/text-to-speech";

type Product = {
  name: string;
  brand: string;
  price: string;
  link: string;
};

type Source = {
  title: string;
  link: string;
};

type AnswerBoxProps = {
  isLoading: boolean;
  title: string;
  icon: React.ReactNode;
  response: string;
  products?: Product[] | null;
  sources?: Source[] | null;
  generatedImageUrl?: string | null;
};

export default function AnswerBox({ isLoading, title, icon, response, products, sources, generatedImageUrl }: AnswerBoxProps) {
  const { toast } = useToast();
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [audioDataUri, setAudioDataUri] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  const handleSpeak = async () => {
    if (!response) return;
    setIsSpeaking(true);
    setAudioDataUri(null);
    try {
      const result = await textToSpeech(response);
      setAudioDataUri(result.audioDataUri);
    } catch (error) {
      console.error("TTS call failed:", error);
      toast({
        variant: "destructive",
        title: "An error occurred",
        description: "Failed to generate speech. Please try again.",
      });
    } finally {
      setIsSpeaking(false);
    }
  };

  useEffect(() => {
    if (audioDataUri && audioRef.current) {
      audioRef.current.play().catch(e => console.error("Audio playback failed", e));
    }
  }, [audioDataUri]);

  useEffect(() => {
    setAudioDataUri(null);
  }, [response]);
  
  const showSkeleton = isLoading && !response && !generatedImageUrl && (!products || products.length === 0) && (!sources || sources.length === 0);

  if (showSkeleton) {
     return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                AI Analysis
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-4/5" />
                </div>
            </CardContent>
        </Card>
     )
  }

  const hasContent = response || generatedImageUrl || (products && products.length > 0) || (sources && sources.length > 0);
  if (!hasContent) {
    return null;
  }
  
  return (
    <Card className="animate-in fade-in duration-500">
      <CardHeader>
        <div className="flex justify-between items-start">
            <CardTitle className="flex items-center gap-2">
            {icon}
            {title}
            </CardTitle>
            {response && !isLoading && (
                <Button onClick={handleSpeak} variant="ghost" size="icon" disabled={isSpeaking} className="shrink-0">
                    {isSpeaking ? <Loader2 className="h-5 w-5 animate-spin" /> : <Volume2 className="h-5 w-5" />}
                    <span className="sr-only">Speak</span>
                </Button>
            )}
        </div>
      </CardHeader>
      <CardContent>
        {generatedImageUrl && (
          <div className="relative aspect-video w-full mb-4 rounded-lg overflow-hidden border">
            <Image src={generatedImageUrl} alt="AI generated image of the identified object" fill className="object-contain" />
          </div>
        )}
        {response && (
            <div className="max-w-none whitespace-pre-wrap text-sm leading-relaxed">
                {response}
            </div>
        )}
        {products && products.length > 0 && (
            <div className={cn("space-y-3", (response || generatedImageUrl) && "mt-4")}>
                {products.map((product, index) => (
                    <a key={index} href={product.link} target="_blank" rel="noopener noreferrer" className="block p-4 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors">
                        <div className="flex justify-between items-start gap-4">
                            <div>
                                <p className="font-semibold text-primary">{product.name}</p>
                                <p className="text-sm text-muted-foreground">{product.brand}</p>
                            </div>
                            <p className="font-bold text-lg text-right whitespace-nowrap">{product.price}</p>
                        </div>
                    </a>
                ))}
            </div>
        )}
        {sources && sources.length > 0 && (
            <div className={cn("space-y-3", (response || generatedImageUrl || (products && products.length > 0)) && "mt-4")}>
                <h4 className="font-semibold text-base">Sources</h4>
                <div className="space-y-2">
                    {sources.map((source, index) => (
                         <a key={index} href={source.link} target="_blank" rel="noopener noreferrer" className="block p-3 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors text-sm">
                             <p className="font-medium text-primary hover:underline">{source.title}</p>
                         </a>
                    ))}
                </div>
            </div>
        )}
      </CardContent>
      {audioDataUri && <audio ref={audioRef} src={audioDataUri} className="hidden" />}
    </Card>
  );
}
