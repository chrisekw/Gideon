
"use client";

import { useState, useRef, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { analyzeImage } from '@/ai/flows/analyze-image';
import { generateImageDescription } from '@/ai/flows/generate-image-description';
import { findProducts } from '@/ai/flows/find-products';
import { Loader2, Camera, ArrowLeft, RefreshCw, Sparkles, ShoppingBag, Menu } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import AnswerBox from '@/components/gideon/answer-box';
import { Textarea } from '@/components/ui/textarea';

type Product = {
  name: string;
  brand: string;
  price: string;
  link: string;
};

export default function CameraPage() {
  const [imageData, setImageData] = useState<string | null>(null);
  const [question, setQuestion] = useState('');
  const [aiResponse, setAiResponse] = useState<string>('');
  const [products, setProducts] = useState<Product[] | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentAction, setCurrentAction] = useState<'ask' | 'find' | null>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
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

  useEffect(() => {
    const getCameraPermission = async () => {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        toast({ variant: 'destructive', title: 'Camera not supported' });
        setHasCameraPermission(false);
        return;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        streamRef.current = stream;
        setHasCameraPermission(true);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (error) {
        setHasCameraPermission(false);
        toast({ variant: 'destructive', title: 'Camera Access Denied' });
      }
    };
    
    getCameraPermission();
    
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [toast]);

  const handleSnap = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg');
        setImageData(dataUrl);
        setProducts(null);
        handleAnalysis(dataUrl, '');
      }
    }
  };

  const handleAskQuestion = () => {
    if (!imageData || !question.trim()) return;
    handleAnalysis(imageData, question);
  };

  const resetCapture = () => {
    setImageData(null);
    setAiResponse('');
    setQuestion('');
    setProducts(null);
    setCurrentAction(null);
  };

  return (
    <div className="fixed inset-0 bg-black text-white flex flex-col items-center justify-center">
      <header className="absolute top-0 left-0 right-0 z-20 p-4 bg-gradient-to-b from-black/50 to-transparent">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/home">
            <ArrowLeft />
          </Link>
        </Button>
      </header>

      <div className="w-full h-full flex items-center justify-center">
        {hasCameraPermission === null && <Loader2 className="h-8 w-8 animate-spin" />}
        {hasCameraPermission === false && (
          <div className="p-4 max-w-sm">
            <Alert variant="destructive">
              <AlertTitle>Camera Access Required</AlertTitle>
              <AlertDescription>
                Please allow camera access to use this feature. You may need to grant permission in your browser settings and reload the page.
              </AlertDescription>
            </Alert>
          </div>
        )}
        
        <div className="w-full h-full relative">
            {!imageData ? (
                 <video ref={videoRef} className="w-full h-full object-cover" autoPlay playsInline muted />
            ) : (
                <Image src={imageData} alt="Snapped photo" fill className="object-contain" />
            )}
        </div>
        <canvas ref={canvasRef} className="hidden" />
      </div>

      <footer className="absolute bottom-0 left-0 right-0 z-20 p-4 md:p-6 bg-gradient-to-t from-black/70 to-transparent">
        <div className="max-w-4xl mx-auto space-y-4">
          {imageData && <AnswerBox isLoading={isAnalyzing} response={aiResponse} products={products} />}
          
          <div className="flex items-center justify-center gap-4">
            {!imageData ? (
              <Button onClick={handleSnap} size="lg" className="w-20 h-20 rounded-full !p-0">
                <Camera className="h-8 w-8" />
              </Button>
            ) : (
               <div className='w-full space-y-3'>
                  <div className='flex gap-2 justify-center'>
                      <Button onClick={resetCapture} variant="outline" className='bg-background/20 backdrop-blur-sm border-gray-600 hover:bg-background/40'>
                          <RefreshCw className="mr-2 h-4 w-4" />
                          Retake
                      </Button>
                      <Button onClick={() => imageData && handleFindProducts(imageData)} disabled={isAnalyzing || !imageData} variant="outline" className='bg-background/20 backdrop-blur-sm border-gray-600 hover:bg-background/40'>
                          {isAnalyzing && currentAction === 'find' ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShoppingBag className="mr-2 h-4 w-4" />}
                          Shop
                      </Button>
                  </div>
                  <div className="flex items-center gap-2">
                      <Textarea
                          placeholder="Ask a follow-up..."
                          value={question}
                          onChange={(e) => setQuestion(e.target.value)}
                          className="resize-none text-base bg-background/20 backdrop-blur-sm border-gray-600 placeholder:text-gray-400"
                          rows={1}
                          disabled={isAnalyzing}
                      />
                      <Button onClick={handleAskQuestion} disabled={isAnalyzing || !question.trim()}>
                          {isAnalyzing && currentAction === 'ask' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                          Ask
                      </Button>
                  </div>
              </div>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
}
