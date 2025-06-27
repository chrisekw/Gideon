"use client";

import { useState, useRef, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { analyzeImage } from '@/ai/flows/analyze-image';
import { generateImageDescription } from '@/ai/flows/generate-image-description';
import { Camera, Loader2, Sparkles, Upload, X } from 'lucide-react';
import AnswerBox from '@/components/gideon/answer-box';

export default function Home() {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageData, setImageData] = useState<string | null>(null);
  const [question, setQuestion] = useState('');
  const [aiResponse, setAiResponse] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleAnalysis = useCallback(async (data: string, userQuestion: string) => {
    setIsAnalyzing(true);
    setAiResponse('');
    try {
      if (userQuestion.trim()) {
        const result = await analyzeImage({ photoDataUri: data, question: userQuestion });
        setAiResponse(result.answer);
      } else {
        const result = await generateImageDescription({ photoDataUri: data });
        setAiResponse(result.description);
      }
    } catch (error) {
      console.error('AI call failed:', error);
      toast({
        variant: 'destructive',
        title: 'An error occurred',
        description: 'Failed to get a response from the AI. Please try again.',
      });
    } finally {
      setIsAnalyzing(false);
    }
  }, [toast]);

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 4 * 1024 * 1024) { // 4MB limit
        toast({
          variant: 'destructive',
          title: 'Image too large',
          description: 'Please select an image smaller than 4MB.',
        });
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setImagePreview(result);
        setImageData(result);
        handleAnalysis(result, '');
      };
      reader.readAsDataURL(file);
    }
  };
  
  const handleAskQuestion = () => {
    if (!imageData || !question.trim()) return;
    handleAnalysis(imageData, question);
  };
  
  const resetState = () => {
    setImagePreview(null);
    setImageData(null);
    setAiResponse('');
    setQuestion('');
    if (fileInputRef.current) {
        fileInputRef.current.value = "";
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-20 border-b bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
            <h1 className="text-2xl font-bold tracking-tight">Gideon</h1>
        </div>
      </header>

      <main className="flex-1 container mx-auto p-4 md:p-8 flex flex-col items-center">
        <div className="w-full max-w-4xl">
          {!imagePreview ? (
            <div className="flex flex-col items-center justify-center text-center gap-8 py-16">
              <div className='space-y-2'>
                <h2 className='text-4xl font-bold'>Intelligent Analysis Starts Here</h2>
                <p className='text-muted-foreground text-lg'>Upload an image or use your camera to begin.</p>
              </div>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button size="lg" onClick={() => fileInputRef.current?.click()}>
                  <Upload className="mr-2" />
                  Upload Image
                </Button>
                <Link href="/camera" passHref>
                  <Button size="lg" variant="secondary">
                    <Camera className="mr-2" />
                    Use Camera
                  </Button>
                </Link>
              </div>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageChange}
                accept="image/*"
                className="hidden"
              />
            </div>
          ) : (
            <div className="relative w-full space-y-4">
              <div className="relative group aspect-video w-full rounded-xl overflow-hidden border">
                <Image src={imagePreview} alt="Selected preview" layout="fill" className="object-contain" />
                <Button
                    variant="destructive"
                    size="icon"
                    className="absolute top-3 right-3 z-10 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={resetState}
                  >
                    <X className="h-4 w-4" />
                  </Button>
              </div>
              
              <AnswerBox isLoading={isAnalyzing} response={aiResponse} />

              <div className="flex gap-4">
                <Textarea
                  placeholder="Ask a follow-up question..."
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  className="resize-none text-base"
                  rows={2}
                  disabled={isAnalyzing}
                />
                <Button 
                  onClick={handleAskQuestion} 
                  disabled={isAnalyzing || !question.trim()}
                  className="h-auto"
                >
                  {isAnalyzing && !aiResponse ? <Loader2 className="animate-spin" /> : <Sparkles />}
                  <span className="hidden sm:inline ml-2">Ask</span>
                </Button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
