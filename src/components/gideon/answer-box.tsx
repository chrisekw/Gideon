
"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, Volume2, Loader2, ArrowLeft, ArrowRight, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { textToSpeech } from "@/ai/flows/text-to-speech";
import HomeworkSolution from "./homework-solution";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { IdentifyObjectOutput } from "@/ai/flows/identify-object";

type Product = {
  name: string;
  brand: string;
  price: string;
  link: string;
  imageUrl: string;
};

type HomeworkSolutionType = {
  question: string;
  solution: string;
  diagramUrl?: string | null;
};

type AnswerBoxProps = {
  isLoading: boolean;
  title: string;
  icon: React.ReactNode;
  response: IdentifyObjectOutput | string | null;
  products?: Product[] | null;
  homeworkSolutions?: HomeworkSolutionType[] | null;
  preamble?: string | null;
};

function isIdentifyObjectOutput(response: any): response is IdentifyObjectOutput {
  return response && typeof response === 'object' && 'label' in response && 'description' in response;
}

export default function AnswerBox({ isLoading, title, icon, response, products, homeworkSolutions, preamble }: AnswerBoxProps) {
  const { toast } = useToast();
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [audioDataUri, setAudioDataUri] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [currentSolutionIndex, setCurrentSolutionIndex] = useState(0);

  useEffect(() => {
    setCurrentSolutionIndex(0);
  }, [homeworkSolutions]);

  const handleSpeak = async () => {
    let textToSpeak = '';

    if (isIdentifyObjectOutput(response)) {
      textToSpeak = `${response.label}. ${response.description}`;
    } else if (typeof response === 'string') {
      textToSpeak = response;
    } else if (homeworkSolutions && homeworkSolutions.length > 0) {
      const currentSolution = homeworkSolutions[currentSolutionIndex];
      textToSpeak = `${preamble || ''}\n\nQuestion: ${currentSolution.question}\n\n${currentSolution.solution}`;
    }

    if (!textToSpeak) return;
    setIsSpeaking(true);
    setAudioDataUri(null);
    try {
      const result = await textToSpeech(textToSpeak);
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
  }, [response, currentSolutionIndex, homeworkSolutions]);
  
  const showLoader = isLoading && !response && (!products || products.length === 0) && (!homeworkSolutions || homeworkSolutions.length === 0);

  if (showLoader) {
     return (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeInOut' }}
        >
          <Card className="bg-background/80 backdrop-blur-sm">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                {icon}
                {title || "AI Analysis"}
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="flex justify-center items-center py-8">
                    <div className="flex items-center justify-center space-x-2">
                        <motion.div
                            className="h-3 w-3 bg-primary rounded-full"
                            animate={{ y: [0, -10, 0] }}
                            transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
                        />
                        <motion.div
                            className="h-3 w-3 bg-primary rounded-full"
                            animate={{ y: [0, -10, 0] }}
                            transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut", delay: 0.2 }}
                        />
                        <motion.div
                            className="h-3 w-3 bg-primary rounded-full"
                            animate={{ y: [0, -10, 0] }}
                            transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut", delay: 0.4 }}
                        />
                    </div>
                </div>
            </CardContent>
          </Card>
        </motion.div>
     )
  }
  
  const isHomework = title === 'Homework Solution' && homeworkSolutions && homeworkSolutions.length > 0;
  const isShopping = title === 'Products Found' && products;
  const hasContent = response || (products && products.length > 0) || isHomework;
  
  if (!hasContent) {
    return null;
  }
  
  const identificationResult = isIdentifyObjectOutput(response) ? response : null;
  const simpleResponse = typeof response === 'string' ? response : null;

  const locationString = identificationResult?.location 
    ? [identificationResult.location.region, identificationResult.location.country].filter(Boolean).join(', ')
    : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeInOut' }}
    >
      <Card className="bg-background/80 backdrop-blur-sm">
        <CardHeader>
          <div className="flex justify-between items-start">
              <CardTitle className="flex items-center gap-2">
              {icon}
              {title}
              </CardTitle>
              {(simpleResponse || identificationResult || isHomework) && !isLoading && !isShopping && (
                  <Button onClick={handleSpeak} variant="ghost" size="icon" disabled={isSpeaking} className="shrink-0">
                      {isSpeaking ? <Loader2 className="h-5 w-5 animate-spin" /> : <Volume2 className="h-5 w-5" />}
                      <span className="sr-only">Speak</span>
                  </Button>
              )}
          </div>
          {isShopping && simpleResponse && <p className="text-sm text-muted-foreground pt-1">{simpleResponse}</p>}
        </CardHeader>
        <CardContent className="overflow-y-auto max-h-[40vh] space-y-4">
          {isHomework ? (
            <div className="space-y-4">
              {preamble && <p className="text-sm text-muted-foreground italic">"{preamble}"</p>}
              
              {homeworkSolutions.length > 1 && (
                <div className="flex items-center justify-between p-2 rounded-lg bg-secondary">
                  <Button variant="ghost" size="icon" onClick={() => setCurrentSolutionIndex(prev => prev - 1)} disabled={currentSolutionIndex === 0}>
                    <ArrowLeft />
                  </Button>
                  <div className="text-sm font-medium">
                    Question {currentSolutionIndex + 1} of {homeworkSolutions.length}
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => setCurrentSolutionIndex(prev => prev + 1)} disabled={currentSolutionIndex === homeworkSolutions.length - 1}>
                    <ArrowRight />
                  </Button>
                </div>
              )}
              <HomeworkSolution solution={homeworkSolutions[currentSolutionIndex]} />
            </div>
          ) : (
            <>
              {identificationResult?.generatedImageUrl && (
                <div className="relative aspect-video w-full rounded-lg overflow-hidden border">
                  <Image src={identificationResult.generatedImageUrl} alt="AI generated visual aid" fill className="object-contain" />
                </div>
              )}
              {identificationResult && (
                <div className="space-y-4">
                  <div className="flex flex-wrap items-baseline gap-x-4 gap-y-2">
                    <h3 className="text-2xl font-bold text-primary">{identificationResult.label}</h3>
                    <Badge variant="secondary" className="capitalize">{identificationResult.type}</Badge>
                  </div>

                  {locationString && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      <span>{locationString}</span>
                    </div>
                  )}

                  <div className="space-y-2">
                     <div className="flex justify-between items-center text-sm">
                       <span className="font-medium text-muted-foreground">Confidence</span>
                       <span>{identificationResult.confidence}%</span>
                     </div>
                     <Progress value={identificationResult.confidence} aria-label={`${identificationResult.confidence}% confidence`} />
                  </div>
                  {identificationResult.description && (
                      <div className="max-w-none whitespace-pre-wrap text-sm leading-relaxed">
                          {identificationResult.description}
                      </div>
                  )}
                  {identificationResult.source && (
                    <div className="text-xs text-muted-foreground/80 pt-2 border-t mt-4">
                        Source: {identificationResult.source} | Version: {identificationResult.version}
                    </div>
                  )}
                </div>
              )}
              {simpleResponse && !isShopping && (
                  <div className="max-w-none whitespace-pre-wrap text-sm leading-relaxed">
                      {simpleResponse}
                  </div>
              )}
              {products && products.length > 0 && (
                  <div className="space-y-3">
                      {products.map((product, index) => (
                        <a key={index} href={product.link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 p-3 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors">
                            <div className="relative w-20 h-20 flex-shrink-0 rounded-md overflow-hidden border">
                                <Image src={product.imageUrl} alt={product.name} fill className="object-cover" unoptimized />
                            </div>
                            <div className="flex-grow">
                                <p className="font-semibold text-primary line-clamp-2">{product.name}</p>

                                <p className="text-sm text-muted-foreground">{product.brand}</p>
                            </div>
                            <p className="font-bold text-lg text-right whitespace-nowrap self-start">{product.price}</p>
                        </a>
                      ))}
                  </div>
              )}
               {products && products.length === 0 && (
                <div className="max-w-none whitespace-pre-wrap text-sm leading-relaxed">
                  {simpleResponse}
                </div>
              )}
            </>
          )}
        </CardContent>
        {audioDataUri && <audio ref={audioRef} src={audioDataUri} className="hidden" />}
      </Card>
    </motion.div>
  );
}
