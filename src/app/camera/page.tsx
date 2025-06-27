"use client";

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { analyzeImage } from '@/ai/flows/analyze-image';
import { generateImageDescription } from '@/ai/flows/generate-image-description';
import { Loader2, Sparkles, Camera, ArrowLeft, RefreshCw } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

export default function CameraPage() {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageData, setImageData] = useState<string | null>(null);
  const [question, setQuestion] = useState('');
  const [aiResponse, setAiResponse] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    let stream: MediaStream | null = null;
    
    const getCameraPermission = async () => {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        toast({
          variant: 'destructive',
          title: 'Camera not supported',
          description: 'Your browser does not support camera access.',
        });
        setHasCameraPermission(false);
        return;
      }
      
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        setHasCameraPermission(true);

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.error('Error accessing camera:', error);
        setHasCameraPermission(false);
        toast({
          variant: 'destructive',
          title: 'Camera Access Denied',
          description: 'Please enable camera permissions in your browser settings.',
        });
      }
    };

    getCameraPermission();

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
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
        setImagePreview(dataUrl);
        setImageData(dataUrl);
        setAiResponse('');
        setQuestion('');
      }
    }
  };

  const handleAskAi = async () => {
    if (!imageData) return;
    setIsLoading(true);
    setAiResponse('');
    try {
      if (question.trim()) {
        const result = await analyzeImage({ photoDataUri: imageData, question });
        setAiResponse(result.answer);
      } else {
        const result = await generateImageDescription({ photoDataUri: imageData });
        setAiResponse(result.description);
      }
    } catch (error)
    {
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

  const resetCapture = () => {
    setImagePreview(null);
    setImageData(null);
    setAiResponse('');
    setQuestion('');
  };

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-10 border-b bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/" passHref>
            <Button variant="ghost" size="icon">
              <ArrowLeft />
            </Button>
          </Link>
          <h1 className="text-xl font-bold tracking-tight">Use Camera</h1>
          <div className="w-10"></div> {/* Spacer */}
        </div>
      </header>

      <main className="flex-1 container mx-auto p-4 md:p-8 flex flex-col items-center gap-4">
        <div className="w-full max-w-2xl aspect-video relative rounded-lg overflow-hidden bg-muted border">
          {hasCameraPermission === null && (
             <div className="flex items-center justify-center h-full">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
             </div>
          )}
          {hasCameraPermission === false && (
            <div className="flex items-center justify-center h-full p-4">
                <Alert variant="destructive">
                    <AlertTitle>Camera Access Required</AlertTitle>
                    <AlertDescription>
                        Please allow camera access to use this feature. You may need to reload the page and grant permission.
                    </AlertDescription>
                </Alert>
            </div>
          )}
          {imagePreview ? (
            <Image src={imagePreview} alt="Snapped photo" layout="fill" objectFit="contain" />
          ) : (
            <video ref={videoRef} className="w-full h-full object-cover" autoPlay playsInline muted />
          )}
          <canvas ref={canvasRef} className="hidden" />
        </div>

        {hasCameraPermission && (
          <div className="w-full max-w-2xl flex flex-col gap-4">
            {!imageData ? (
              <Button onClick={handleSnap} size="lg" className="w-full">
                <Camera className="mr-2 h-5 w-5" />
                Snap Photo
              </Button>
            ) : (
              <>
                <Card>
                    <CardHeader>
                        <CardTitle>Ask about the photo</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Textarea
                            placeholder="Ask a question... (optional)"
                            value={question}
                            onChange={(e) => setQuestion(e.target.value)}
                            className="resize-none"
                            rows={3}
                            disabled={isLoading}
                        />
                    </CardContent>
                </Card>

                <div className="flex gap-4">
                    <Button onClick={resetCapture} variant="outline" disabled={isLoading}>
                        <RefreshCw className="mr-2" />
                        Retake
                    </Button>
                    <Button onClick={handleAskAi} disabled={isLoading} className="flex-1">
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
                </div>
                
                <Card className="flex-1 flex flex-col">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-primary" />
                        AI Response
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1 min-h-[100px]">
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
              </>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
