
"use client";

import { useState, useRef, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { analyzeImage } from '@/ai/flows/analyze-image';
import { findProducts } from '@/ai/flows/find-products';
import { solveHomework } from '@/ai/flows/solve-homework';
import { identifyObject, IdentifyObjectOutput } from '@/ai/flows/identify-object';
import { extractText } from '@/ai/flows/extract-text';
import { motion } from 'framer-motion';
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
  imageUrl: string;
};

type HomeworkSolution = {
  question: string;
  solution: string;
  diagramUrl?: string | null;
};

export default function HomePage() {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageData, setImageData] = useState<string | null>(null);
  const [question, setQuestion] = useState('');
  const [aiResponse, setAiResponse] = useState<IdentifyObjectOutput | string | null>(null);
  const [products, setProducts] = useState<Product[] | null>(null);
  const [homeworkSolutions, setHomeworkSolutions] = useState<HomeworkSolution[] | null>(null);
  const [preamble, setPreamble] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentAction, setCurrentAction] = useState<string | null>(null);
  const [answerTitle, setAnswerTitle] = useState('');
  const [answerIcon, setAnswerIcon] = useState(<Sparkles className="h-5 w-5 text-primary" />);
  const [location, setLocation] = useState<{ latitude: number, longitude: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const resetAiState = () => {
    setAiResponse(null);
    setProducts(null);
    setHomeworkSolutions(null);
    setPreamble('');
  }

  const handleAnalysis = useCallback(async (data: string, userQuestion: string) => {
    setIsAnalyzing(true);
    setCurrentAction('ask');
    resetAiState();
    
    try {
      if (userQuestion.trim()) {
        setAnswerTitle('AI Analysis');
        setAnswerIcon(<Sparkles className="h-5 w-5 text-primary" />);
        const result = await analyzeImage({ photoDataUri: data, question: userQuestion });
        setAiResponse(result.answer);
      } else {
        await handleIdentifyObject(data, true); // default action
      }
    } catch (error) {
      console.error('AI call failed:', error);
      toast({
        variant: 'destructive',
        title: 'An error occurred',
        description: 'Failed to get a response from the AI. Please try again.',
      });
      setIsAnalyzing(false); // Ensure loader stops on error
      setCurrentAction(null);
    } 
    // `finally` block is removed here because `handleIdentifyObject` has its own `finally`
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
        setProducts([]);
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
      setHomeworkSolutions(result.solutions);
      setPreamble(result.preamble || '');
    } catch (error) {
      console.error('AI call failed:', error);
      toast({ variant: 'destructive', title: 'An error occurred', description: 'Failed to solve. Please try again.'});
    } finally {
      setIsAnalyzing(false);
      setCurrentAction(null);
    }
  }, [toast]);

  const requestLocation = (): Promise<{ latitude: number, longitude: number } | null> => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        toast({ variant: 'destructive', title: 'Geolocation not supported', description: 'Your browser does not support location services.' });
        resolve(null);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const newLocation = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          };
          setLocation(newLocation);
          resolve(newLocation);
        },
        (error) => {
          let description = "Could not get your location. Identification may be less accurate for landmarks.";
          switch (error.code) {
            case error.PERMISSION_DENIED:
              description = "Location access was denied. Please enable it in browser settings for better landmark identification.";
              break;
            case error.POSITION_UNAVAILABLE:
              description = "Location information is unavailable. Please check your device's location settings.";
              break;
            case error.TIMEOUT:
              description = "The request to get user location timed out.";
              break;
          }
          toast({ variant: "destructive", title: "Location Error", description });
          resolve(null);
        }
      );
    });
  };

  const handleIdentifyObject = useCallback(async (data: string, fromHandleAnalysis = false) => {
    // If called from handleAnalysis, don't set loading state again.
    if (!fromHandleAnalysis) {
      setIsAnalyzing(true);
      setCurrentAction('identify');
      resetAiState();
    }
    setAnswerTitle('Identification');
    setAnswerIcon(<Leaf className="h-5 w-5 text-primary" />);

    try {
      const loc = await requestLocation();
      const result = await identifyObject({ 
        photoDataUri: data,
        ...(loc && { latitude: loc.latitude, longitude: loc.longitude })
      });
      setAiResponse(result);
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
    resetAiState();
    setQuestion('');
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
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center"
          >
            <h2 className='text-5xl font-bold tracking-tighter'>GiDEON</h2>
            <p className='text-muted-foreground text-xl mt-2'>Snap. Ask. Discover.</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex flex-col sm:flex-row gap-4"
          >
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
          </motion.div>
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
          
          <AnswerBox 
            isLoading={isAnalyzing} 
            title={answerTitle} 
            icon={answerIcon} 
            response={aiResponse} 
            products={products}
            homeworkSolutions={homeworkSolutions}
            preamble={preamble}
          />

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
