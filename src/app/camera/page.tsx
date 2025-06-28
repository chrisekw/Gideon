
"use client";

import { useState, useRef, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { analyzeImage } from '@/ai/flows/analyze-image';
import { findProducts } from '@/ai/flows/find-products';
import { solveHomework } from '@/ai/flows/solve-homework';
import { identifyObject } from '@/ai/flows/identify-object';
import { extractText } from '@/ai/flows/extract-text';
import { Loader2, Camera, ArrowLeft, RefreshCw, Sparkles, ShoppingBag, Calculator, Leaf, ScanText, Zap } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import AnswerBox from '@/components/gideon/answer-box';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

type Product = {
  name: string;
  brand: string;
  price: string;
  link: string;
  imageUrl: string;
};

type Source = {
  title: string;
  link: string;
};

type HomeworkSolution = {
  question: string;
  solution: string;
  diagramUrl?: string | null;
};

export default function CameraPage() {
  const [imageData, setImageData] = useState<string | null>(null);
  const [question, setQuestion] = useState('');
  const [aiResponse, setAiResponse] = useState<string>('');
  const [products, setProducts] = useState<Product[] | null>(null);
  const [sources, setSources] = useState<Source[] | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [homeworkSolutions, setHomeworkSolutions] = useState<HomeworkSolution[] | null>(null);
  const [preamble, setPreamble] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentAction, setCurrentAction] = useState<string | null>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [answerTitle, setAnswerTitle] = useState('');
  const [answerIcon, setAnswerIcon] = useState(<Sparkles className="h-5 w-5 text-primary" />);
  const [isTorchOn, setIsTorchOn] = useState(false);
  const [location, setLocation] = useState<{ latitude: number, longitude: number } | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const { toast } = useToast();

  const resetAiState = () => {
    setAiResponse('');
    setProducts(null);
    setSources(null);
    setImageUrl(null);
    setHomeworkSolutions(null);
    setPreamble('');
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
        // Default action is now to identify the object
        const result = await identifyObject({ 
            photoDataUri: data,
            ...(location && { latitude: location.latitude, longitude: location.longitude })
        });
        let responseText = `${result.identification}\n\n${result.description}`;
        if (result.location) {
          responseText += `\n\n**Location:** ${result.location}`;
        }
        setAiResponse(responseText);
        setSources(result.sources || null);
        setImageUrl(result.generatedImageUrl || null);
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
  }, [toast, location]);
  
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

  const handleIdentifyObject = useCallback(async (data: string) => {
    setIsAnalyzing(true);
    setCurrentAction('identify');
    resetAiState();
    setAnswerTitle('Identification');
    setAnswerIcon(<Leaf className="h-5 w-5 text-primary" />);
    try {
      const result = await identifyObject({ 
          photoDataUri: data,
          ...(location && { latitude: location.latitude, longitude: location.longitude })
      });
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
  }, [toast, location]);
  
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

  const handleToggleTorch = useCallback(async () => {
    if (!streamRef.current) return;

    const videoTrack = streamRef.current.getVideoTracks()[0];
    if (videoTrack && 'getCapabilities' in videoTrack) {
      try {
        // @ts-ignore - torch is a valid constraint but not in all TS lib versions
        const capabilities = videoTrack.getCapabilities();
        if (capabilities.torch) {
          const newTorchState = !isTorchOn;
          await videoTrack.applyConstraints({
            advanced: [{ torch: newTorchState }],
          });
          setIsTorchOn(newTorchState);
        } else {
          toast({
            title: "Flashlight Not Supported",
            description: "Your device or browser does not support controlling the flashlight.",
          });
        }
      } catch (error) {
        console.error("Error toggling torch:", error);
        toast({
          variant: 'destructive',
          title: 'Flashlight Error',
          description: error instanceof Error ? error.message : 'Could not toggle the flashlight.',
        });
      }
    } else {
      toast({
          title: "Flashlight Not Available",
          description: "Cannot access flashlight controls.",
      });
    }
  }, [isTorchOn, toast]);

  const startCamera = useCallback(async () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
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
  }, [toast]);

  useEffect(() => {
    startCamera();

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        (error) => {
          console.error("Geolocation error:", error);
          toast({
            variant: "destructive",
            title: "Location Error",
            description: "Could not get your location. Identification may be less accurate for landmarks.",
          });
        }
      );
    }
    
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [startCamera, toast]);

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
        handleAnalysis(dataUrl, '');

        if (streamRef.current) {
          if (isTorchOn) {
            const videoTrack = streamRef.current.getVideoTracks()[0];
            // @ts-ignore
            if (videoTrack && 'getCapabilities' in videoTrack && videoTrack.getCapabilities().torch) {
              try {
                videoTrack.applyConstraints({ advanced: [{ torch: false }] });
                setIsTorchOn(false);
              } catch (e) {
                console.error("Failed to turn off torch", e);
              }
            }
          }
          // Stop all camera tracks
          streamRef.current.getTracks().forEach(track => track.stop());
        }
      }
    }
  };

  const handleAskQuestion = () => {
    if (!imageData || !question.trim()) return;
    handleAnalysis(imageData, question);
  };

  const resetCapture = () => {
    setImageData(null);
    resetAiState();
    setQuestion('');
    setCurrentAction(null);
    startCamera();
  };

  const ActionButton = ({ onClick, action, icon, children }: { onClick: () => void, action: string, icon: React.ReactNode, children: React.ReactNode }) => (
    <Button onClick={onClick} disabled={isAnalyzing} variant="outline" className='bg-background/20 backdrop-blur-sm border-gray-600 hover:bg-background/40'>
      {isAnalyzing && currentAction === action ? <Loader2 className="h-4 w-4 animate-spin" /> : icon}
      {children}
    </Button>
  );

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
          {imageData && (
            <AnswerBox 
              isLoading={isAnalyzing} 
              title={answerTitle} 
              icon={answerIcon} 
              response={aiResponse} 
              products={products} 
              sources={sources} 
              imageUrl={imageUrl}
              homeworkSolutions={homeworkSolutions}
              preamble={preamble}
            />
          )}
          
          <div className="flex items-end justify-center gap-4">
            {!imageData ? (
              <div className="relative w-full flex justify-center items-center h-20">
                <Button onClick={handleSnap} size="lg" className="w-20 h-20 rounded-full !p-0">
                  <Camera className="h-8 w-8" />
                </Button>
                <div className="absolute right-0">
                  <Button onClick={handleToggleTorch} variant="ghost" size="icon" className="w-16 h-16 rounded-full bg-black/30 hover:bg-black/50">
                    <Zap className={cn("h-6 w-6 text-white", isTorchOn && "fill-yellow-300 text-yellow-400")} />
                    <span className="sr-only">Toggle Flashlight</span>
                  </Button>
                </div>
              </div>
            ) : (
               <div className='w-full space-y-3'>
                  <div className="grid grid-cols-2 gap-2">
                    <ActionButton onClick={resetCapture} action="retake" icon={<RefreshCw className="mr-2 h-4 w-4" />}>Retake</ActionButton>
                    <ActionButton onClick={() => handleFindProducts(imageData)} action="find" icon={<ShoppingBag className="mr-2 h-4 w-4" />}>Shop</ActionButton>
                    <ActionButton onClick={() => handleSolveHomework(imageData)} action="solve" icon={<Calculator className="mr-2 h-4 w-4" />}>Solve</ActionButton>
                    <ActionButton onClick={() => handleIdentifyObject(imageData)} action="identify" icon={<Leaf className="mr-2 h-4 w-4" />}>Identify</ActionButton>
                  </div>
                  <div className="flex items-center gap-2">
                      <Textarea
                          placeholder="Ask a question or specify a task for Extract/Ask"
                          value={question}
                          onChange={(e) => setQuestion(e.target.value)}
                          className="resize-none text-base bg-background/20 backdrop-blur-sm border-gray-600 placeholder:text-gray-400"
                          rows={1}
                          disabled={isAnalyzing}
                      />
                      <div className="flex flex-col gap-2">
                        <Button size="sm" className="h-auto py-1.5" onClick={() => handleExtractText(imageData)} disabled={isAnalyzing || !question.trim()}>
                            {isAnalyzing && currentAction === 'extract' ? <Loader2 className="h-4 w-4 animate-spin" /> : <ScanText className="mr-2 h-4 w-4" />}
                            Extract
                        </Button>
                        <Button size="sm" className="h-auto py-1.5" onClick={handleAskQuestion} disabled={isAnalyzing || !question.trim()}>
                            {isAnalyzing && currentAction === 'ask' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                            Ask
                        </Button>
                      </div>
                  </div>
              </div>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
}
