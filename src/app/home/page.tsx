
"use client";

import { useState, useRef, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { analyzeImage } from '@/ai/flows/analyze-image';
import { generateImageDescription } from '@/ai/flows/generate-image-description';
import { findProducts } from '@/ai/flows/find-products';
import { Camera, Loader2, Sparkles, Upload, X, ShoppingBag } from 'lucide-react';
import AnswerBox from '@/components/gideon/answer-box';

type Product = {
  name: string;
  description: string;
  link: string;
};

export default function HomePage() {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageData, setImageData] = useState<string | null>(null);
  const [question, setQuestion] = useState('');
  const [aiResponse, setAiResponse] = useState<string>('');
  const [products, setProducts] = useState<Product[] | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentAction, setCurrentAction] = useState<'ask' | 'find' | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleAnalysis = useCallback(async (data: string, userQuestion: string) => {
    setIsAnalyzing(true);
    setCurrentAction('ask');
    setAiResponse('');
    setProducts(null);
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
      setCurrentAction(null);
    }
  }, [toast]);
  
  const handleFindProducts = useCallback(async (data: string) => {
    setIsAnalyzing(true);
    setCurrentAction('find');
    setAiResponse('');
    setProducts(null);
    try {
      const result = await findProducts({ photoDataUri: data });
      if (result.products && result.products.length > 0) {
        setProducts(result.products);
        setAiResponse(`I found ${result.products.length} product(s) in the image.`);
      } else {
        setAiResponse("I couldn't find any products in the image.");
      }
    } catch (error) {
      console.error('AI call failed:', error);
      toast({
        variant: 'destructive',
        title: 'An error occurred',
        description: 'Failed to find products. Please try again.',
      });
    } finally {
      setIsAnalyzing(false);
      setCurrentAction(null);
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
        setProducts(null);
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
    setProducts(null);
    setCurrentAction(null);
    if (fileInputRef.current) {
        fileInputRef.current.value = "";
    }
  };

  return (
    <div className="w-full max-w-4xl flex-1 flex flex-col container p-4 md:p-8">
      {!imagePreview ? (
        <div className="flex flex-col items-center justify-center text-center gap-8 flex-1">
          <div className="text-center">
            <h2 className='text-5xl font-bold tracking-tighter'>GIDEON</h2>
            <p className='text-muted-foreground text-xl mt-2'>Snap. Ask. Discover.</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-4">
            <Button size="lg" onClick={() => fileInputRef.current?.click()}>
              <Upload className="mr-2" />
              Upload Image
            </Button>
            <Button size="lg" variant="secondary" asChild>
              <Link href="/camera">
                <Camera className="mr-2" />
                Use Camera
              </Link>
            </Button>
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
            <Image src={imagePreview} alt="Selected preview" fill={true} className="object-contain" />
            <Button
                variant="destructive"
                size="icon"
                className="absolute top-3 right-3 z-10 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={resetState}
              >
                <X className="h-4 w-4" />
              </Button>
          </div>
          
          <AnswerBox isLoading={isAnalyzing} response={aiResponse} products={products} />

          <div className="flex gap-4">
            <Textarea
              placeholder="Ask a follow-up question..."
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              className="resize-none text-base"
              rows={2}
              disabled={isAnalyzing}
            />
            <div className='flex flex-col gap-2'>
              <Button 
                onClick={handleAskQuestion} 
                disabled={isAnalyzing || !question.trim()}
                className="h-auto"
              >
                {isAnalyzing && currentAction === 'ask' ? <Loader2 className="animate-spin" /> : <Sparkles />}
                <span className="hidden sm:inline ml-2">Ask</span>
              </Button>
               <Button 
                  onClick={() => imageData && handleFindProducts(imageData)} 
                  disabled={isAnalyzing || !imageData}
                  variant="secondary"
                  className="h-auto"
              >
                  {isAnalyzing && currentAction === 'find' ? <Loader2 className="animate-spin" /> : <ShoppingBag />}
                  <span className="hidden sm:inline ml-2">Shop</span>
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
