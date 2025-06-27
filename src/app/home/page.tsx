
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
import { solveHomework } from '@/ai/flows/solve-homework';
import { identifyObject } from '@/ai/flows/identify-object';
import { extractText } from '@/ai/flows/extract-text';
import {
  Camera,
  Loader2,
  Sparkles,
  Upload,
  X,
  ShoppingBag,
  Calculator,
  Leaf,
  ScanText,
} from 'lucide-react';
import AnswerBox from '@/components/gideon/answer-box';

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

export default function HomePage() {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageData, setImageData] = useState<string | null>(null);
  const [question, setQuestion] = useState('');
  const [aiResponse, setAiResponse] = useState<string>('');
  const [products, setProducts] = useState<Product[] | null>(null);
  const [sources, setSources] = useState<Source[] | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentAction, setCurrentAction] = useState<string | null>(null);
  const [answerTitle, setAnswerTitle] = useState('');
  const [answerIcon, setAnswerIcon] = useState(<Sparkles className="h-5 w-5 text-primary" />);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const resetAiState = () => {
    setAiResponse('');
    setProducts(null);
    setSources(null);
    setImageUrl(null);
  }

  const handleAnalysis = useCallback(async (data: string, userQuestion: string) => {
    setIsAnalyzing(true);
    setCurrentAction('ask');
    resetAiState();
    setAnswerTitle('AI Analysis');
    setAnswerIcon(<Sparkles className="h-5 w-5 text-primary" />);
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
    resetAiState();
    setAnswerTitle('Products Found');
    setAnswerIcon(<ShoppingBag className="h-5 w-5 text-primary" />);
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

  const handleSolveHomework = useCallback(async (data: string) => {
    setIsAnalyzing(true);
    setCurrentAction('solve');
    resetAiState();
    setAnswerTitle('Homework Solution');
    setAnswerIcon(<Calculator className="h-5 w-5 text-primary" />);
    try {
      const result = await solveHomework({ photoDataUri: data });
      setAiResponse(result.solution);
      setImageUrl(result.diagramUrl || null);
    } catch (error) {
      console.error('AI call failed:', error);
      toast({ variant: 'destructive', title: 'An error occurred', description: 'Failed to solve. Please try again.'});
    } finally {
      setIsAnalyzing(false);
      setCurrentAction(null);
    }
  }, [toast]);

  const handleIdentifyObject = useCallback(async (data: string) => {
    setIsAnalyzing(true);
    setCurrentAction('identify');
    resetAiState();
    setAnswerTitle('Identification');
    setAnswerIcon(<Leaf className="h-5 w-5 text-primary" />);
    try {
      const result = await identifyObject({ photoDataUri: data });
      let responseText = `${result.identification}\n\n${result.description}`;
      if (result.location) {
        responseText += `\n\n**Location:** ${result.location}`;
      }
      setAiResponse(responseText);
      setSources(result.sources || null);
      setImageUrl(result.generatedImageUrl || null);
    } catch (error) {
      console.error('AI call failed:', error);
      toast({ variant: 'destructive', title: 'An error occurred', description: 'Failed to identify. Please try again.'});
    } finally {
      setIsAnalyzing(false);
      setCurrentAction(null);
    }
  }, [toast]);
  
  const handleExtractText = useCallback(async (data: string) => {
    if (!question.trim()) {
      toast({ title: 'Task required', description: 'Please describe what to do with the text (e.g., "summarize", "translate to Spanish").' });
      return;
    }
    setIsAnalyzing(true);
    setCurrentAction('extract');
    resetAiState();
    setAnswerTitle('Text Result');
    setAnswerIcon(<ScanText className="h-5 w-5 text-primary" />);
    try {
      const result = await extractText({ photoDataUri: data, task: question });
      setAiResponse(result.result);
    } catch (error) {
      console.error('AI call failed:', error);
      toast({ variant: 'destructive', title: 'An error occurred', description: 'Failed to process text. Please try again.'});
    } finally {
      setIsAnalyzing(false);
      setCurrentAction(null);
    }
  }, [toast, question]);

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
    setSources(null);
    setImageUrl(null);
    setCurrentAction(null);
    if (fileInputRef.current) {
        fileInputRef.current.value = "";
    }
  };

  const ActionButton = ({ onClick, action, children }: { onClick: () => void, action: string, children: React.ReactNode }) => (
    <Button onClick={onClick} disabled={!imageData || isAnalyzing} variant="outline" size="sm" className="flex-1">
      {isAnalyzing && currentAction === action ? <Loader2 className="animate-spin" /> : children}
    </Button>
  );

  return (
    <div className="w-full max-w-4xl flex-1 flex flex-col container p-4 md:p-8">
      {!imagePreview ? (
        <div className="flex flex-col items-center justify-center text-center gap-6 flex-1 py-8">
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
          
          <AnswerBox isLoading={isAnalyzing} title={answerTitle} icon={answerIcon} response={aiResponse} products={products} sources={sources} imageUrl={imageUrl} />

          <div className="space-y-2">
            <div className="flex gap-2">
              <ActionButton onClick={() => handleFindProducts(imageData!)} action="find"><ShoppingBag className="mr-2 h-4 w-4" />Shop</ActionButton>
              <ActionButton onClick={() => handleSolveHomework(imageData!)} action="solve"><Calculator className="mr-2 h-4 w-4" />Solve</ActionButton>
              <ActionButton onClick={() => handleIdentifyObject(imageData!)} action="identify"><Leaf className="mr-2 h-4 w-4" />Identify</ActionButton>
            </div>
            <div className="flex gap-2">
              <Textarea
                placeholder="Ask a question, or provide a task for 'Extract' (e.g. 'summarize')"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                className="resize-none text-base"
                rows={1}
                disabled={isAnalyzing}
              />
              <div className='flex flex-col gap-2'>
                <Button 
                  onClick={() => handleExtractText(imageData!)} 
                  disabled={isAnalyzing || !question.trim() || !imageData}
                  className="h-auto"
                >
                  {isAnalyzing && currentAction === 'extract' ? <Loader2 className="animate-spin" /> : <ScanText />}
                  <span className="hidden sm:inline ml-2">Extract</span>
                </Button>
                <Button 
                  onClick={handleAskQuestion} 
                  disabled={isAnalyzing || !question.trim() || !imageData}
                  className="h-auto"
                >
                  {isAnalyzing && currentAction === 'ask' ? <Loader2 className="animate-spin" /> : <Sparkles />}
                  <span className="hidden sm:inline ml-2">Ask</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
