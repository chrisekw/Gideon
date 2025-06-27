"use client";

import { useState, useRef } from 'react';
import Image from 'next/image';
import { Camera, Eye, Loader2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { analyzeImage } from '@/ai/flows/analyze-image';
import { generateImageDescription } from '@/ai/flows/generate-image-description';
import AnswerBox from '@/components/gideon/answer-box';
import { motion, AnimatePresence } from 'framer-motion';

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

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 sm:p-8 bg-background">
      <div className="w-full max-w-2xl">
        <Card className="w-full shadow-2xl">
          <CardHeader className="text-center p-6 sm:p-8">
            <div className="flex justify-center items-center mb-4">
              <div className="bg-primary p-3 rounded-full shadow-lg">
                <Eye className="h-8 w-8 text-primary-foreground" />
              </div>
            </div>
            <CardTitle className="font-headline text-3xl md:text-4xl tracking-tight">Snap a Photo. Get Instant Answers.</CardTitle>
            <CardDescription className="text-base text-muted-foreground mt-2 max-w-xl mx-auto">Snap any image and let Gideon tell you what it is, how to use it, or where to find it.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div
              className="relative aspect-video w-full border-2 border-dashed border-border rounded-lg flex items-center justify-center cursor-pointer hover:border-primary transition-colors bg-muted/20"
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageChange}
                accept="image/*"
                className="hidden"
              />
              {imagePreview ? (
                <Image src={imagePreview} alt="Selected preview" fill style={{ objectFit: 'contain' }} className="rounded-lg p-1" />
              ) : (
                <div className="text-center text-muted-foreground p-4">
                  <Camera className="mx-auto h-12 w-12 mb-2" />
                  <p className="font-medium">Click to upload an image</p>
                  <p className="text-xs">PNG, JPG, GIF up to 4MB</p>
                </div>
              )}
            </div>
            <Textarea
              placeholder="Ask a question about the image... (optional)"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              className="resize-none"
              rows={3}
            />
          </CardContent>
          <CardFooter>
            <Button onClick={handleAskAi} disabled={isLoading || !imagePreview} className="w-full bg-accent hover:bg-accent/90 text-accent-foreground text-lg py-6">
              {isLoading ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              ) : (
                <Sparkles className="mr-2 h-5 w-5" />
              )}
              {isLoading ? 'Thinking...' : 'Ask AI'}
            </Button>
          </CardFooter>
        </Card>
        
        <AnimatePresence>
          {(isLoading || aiResponse) && (
            <motion.div
              className="mt-8 w-full"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.3 }}
            >
              <AnswerBox isLoading={isLoading} response={aiResponse} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}
