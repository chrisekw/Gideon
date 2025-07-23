
"use client";

import { useState, useRef, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { analyzeImage } from '@/ai/flows/analyze-image';
import { findProducts } from '@/ai/flows/find-products';
import { solveHomework } from '@/ai/flows/solve-homework';
import { identifyObject, IdentifyObjectOutput } from '@/ai/flows/identify-object';
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

type HomeworkSolution = {
  question: string;
  solution: string;
  diagramUrl?: string | null;
};

export default function CameraPage() {
  const [imageData, setImageData] = useState<string | null>(null);
  const [question, setQuestion] = useState('');
  const [aiResponse, setAiResponse] = useState<IdentifyObjectOutput | string | null>(null);
  const [products, setProducts] = useState<Product[] | null>(null);
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
        setAnswerTitle('Identification');
        setAnswerIcon(<Leaf className="h-5 w-5 text-primary" />);
        const result = await identifyObject({ 
            photoDataUri: data,
            ...(location && { latitude: location.latitude, longitude: location.longitude })
        });
        setAiResponse(result);
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
      setAiResponse(result);
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
    if (!streamRef.current) {
      toast({ title: "Camera not ready", description: "The camera stream is not available yet." });
      return;
    }

    const videoTrack = streamRef.current.getVideoTracks()[0];
    if (!videoTrack || videoTrack.readyState !== 'live') {
      toast({ title: "Camera not ready", description: "The camera track is not active." });
      return;
    }

    if (!('getCapabilities' in videoTrack)) {
      toast({ title: "Flashlight Not Supported", description: "Your browser does not support this feature." });
      return;
    }

    try {
      // @ts-ignore
      const capabilities = videoTrack.getCapabilities();
      if (!capabilities.torch) {
        toast({ title: "Flashlight Not Supported", description: "Your device does not have a flashlight or the browser cannot control it." });
        return;
      }

      const newTorchState = !isTorchOn;
      await videoTrack.applyConstraints({
        advanced: [{ torch: newTorchState }],
      });
      setIsTorchOn(newTorchState);
    } catch (error) {
      console.error("Error toggling torch:", error);
      let title = "Flashlight Error";
      let description = "An unexpected error occurred while trying to control the flashlight.";
      
      if (error instanceof DOMException) {
          if (error.name === 'NotSupportedError' || error.message.toLowerCase().includes('setphotooptions failed')) {
              title = "Flashlight Not Supported";
              description = "This feature is not supported by your device or browser. Please try updating your browser.";
          } else if (error.name === 'OverconstrainedError') {
              title = "Flashlight Conflict";
              description = "The camera cannot be configured with the flashlight on. Another app might be using the camera.";
          } else {
              description = `Camera error: ${error.name}`;
          }
      } else if (error instanceof Error) {
        description = error.message;
      }
      
      toast({ variant: 'destructive', title, description });
      setIsTorchOn(false);
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
          console.error("Geolocation error:", error.message);
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
          toast({
            variant: "destructive",
            title: "Location Error",
            description: description,
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
        
        // Turn off torch and stop stream BEFORE updating state to prevent race conditions
        if (streamRef.current) {
          const videoTrack = streamRef.current.getVideoTracks()[0];
          if (isTorchOn && videoTrack && videoTrack.readyState === 'live') {
            try {
              // @ts-ignore
              if ('getCapabilities' in videoTrack && videoTrack.getCapabilities().torch) {
                videoTrack.applyConstraints({ advanced: [{ torch: false }] });
                setIsTorchOn(false);
              }
            } catch (e) {
                console.error("Failed to turn off torch during snap:", e);
            }
          }
          // Stop all camera tracks
          streamRef.current.getTracks().forEach(track => track.stop());
        }

        setImageData(dataUrl);
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
