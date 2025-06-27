"use client";

import { useState, useRef } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { analyzeImage } from '@/ai/flows/analyze-image';
import { generateImageDescription } from '@/ai/flows/generate-image-description';
import { Loader2, Sparkles, Upload } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export default function Home() {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageData, setImageData] = useState<string | null>(null);
  const [question, setQuestion] = useState('');
  const [aiResponse, setAiResponse] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 4 * 1024 * 1024) { // 4MB limit for Gemini
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
        setAiResponse('');
        setQuestion('');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAskAi = async () => {
    if (!imageData) {
      toast({
        variant: 'destructive',
        title: 'No Image Selected',
        description: 'Please select an image before asking the AI.',
      });
      return;
    }

    setIsLoading(true);
    setAiResponse('');

    try {
      if (question.trim()) {
        const result = await analyzeImage({
          photoDataUri: imageData,
          question,
        });
        setAiResponse(result.answer);
      } else {
        const result = await generateImageDescription({
          photoDataUri: imageData,
        });
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
      setIsLoading(false);
    }
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
      <header className="sticky top-0 z-10 border-b bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
            <h1 className="text-2xl font-bold tracking-tight">Gideon Eye</h1>
            <p className="text-sm text-muted-foreground">Your intelligent image analysis assistant.</p>
        </div>
      </header>

      <main className="flex-1 container mx-auto p-4 md:p-8">
        <div className="grid md:grid-cols-2 gap-8">
          <div className="flex flex-col gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Upload Image</CardTitle>
                <CardDescription>Select an image file to analyze.</CardDescription>
              </CardHeader>
              <CardContent>
                <div 
                  className="aspect-video rounded-lg border-2 border-dashed border-border flex items-center justify-center cursor-pointer bg-muted/20 hover:bg-muted/50 transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {imagePreview ? (
                    <Image src={imagePreview} alt="Selected preview" width={400} height={225} className="object-contain w-full h-full rounded-md" />
                  ) : (
                    <div className="text-center text-muted-foreground p-4">
                      <Upload className="mx-auto h-12 w-12 mb-2" />
                      <p className="font-semibold">Click to upload an image</p>
                      <p className="text-xs mt-1">(Max 4MB)</p>
                    </div>
                  )}
                </div>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageChange}
                  accept="image/*"
                  className="hidden"
                />
              </CardContent>
            </Card>

            <Textarea
              placeholder="Ask a question about the image... (optional)"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              className="resize-none"
              rows={3}
              disabled={!imageData}
            />

            <div className="flex gap-4">
              <Button onClick={handleAskAi} disabled={isLoading || !imageData} className="w-full">
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    {question.trim() ? 'Ask AI' : 'Describe Image'}
                  </>
                )}
              </Button>
              {imagePreview && (
                <Button variant="outline" onClick={resetState} disabled={isLoading}>
                  Reset
                </Button>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <Card className="flex-1 flex flex-col">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  AI Response
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1">
                {isLoading ? (
                  <div className="space-y-3 p-1">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                  </div>
                ) : (
                  <p className="whitespace-pre-wrap text-muted-foreground">
                    {aiResponse || 'The AI\'s response will appear here.'}
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
