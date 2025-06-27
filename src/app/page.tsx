
"use client";

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { Camera, Eye, Loader2, Sparkles, Upload, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { analyzeImage } from '@/ai/flows/analyze-image';
import { generateImageDescription } from '@/ai/flows/generate-image-description';
import AnswerBox from '@/components/gideon/answer-box';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

export default function Home() {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageData, setImageData] = useState<string | null>(null);
  const [question, setQuestion] = useState('');
  const [aiResponse, setAiResponse] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    let stream: MediaStream | null = null;

    const startCamera = async () => {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setHasCameraPermission(false);
        toast({
          variant: 'destructive',
          title: 'Camera Not Supported',
          description: 'Your browser does not support camera access.',
        });
        return;
      }
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setHasCameraPermission(true);
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

    if (!imagePreview) {
      startCamera();
    }

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    };
  }, [imagePreview, toast]);

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

  const handleSnap = () => {
    if (videoRef.current && hasCameraPermission) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        const dataUri = canvas.toDataURL('image/jpeg');
        setImagePreview(dataUri);
        setImageData(dataUri);
      }
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

  const reset = () => {
    setImagePreview(null);
    setImageData(null);
    setAiResponse('');
    setQuestion('');
    if (fileInputRef.current) {
        fileInputRef.current.value = "";
    }
  };

  return (
    <main className="flex h-screen flex-col items-center bg-black text-white">
      <div className="w-full max-w-2xl flex flex-col h-full">
        <header className="flex justify-between items-center p-4 bg-black/50 z-10">
            <h1 className="text-xl font-bold flex items-center gap-2"><Eye className="h-6 w-6" /> Gideon Eye</h1>
            {imagePreview && (
                <Button variant="ghost" size="icon" onClick={reset}>
                    <RotateCcw className="h-5 w-5" />
                </Button>
            )}
        </header>

        <div className="relative flex-1 flex items-center justify-center bg-black overflow-hidden">
            <video ref={videoRef} className={cn("w-full h-full object-cover", { "hidden": !!imagePreview })} autoPlay muted playsInline />
            {imagePreview && (
                <Image src={imagePreview} alt="Selected preview" layout="fill" objectFit="contain" />
            )}
            
            {!hasCameraPermission && !imagePreview && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 p-4 text-center">
                    <Camera className="h-16 w-16 mb-4 text-gray-500" />
                    <h2 className="text-xl font-semibold mb-2">Camera is off</h2>
                    <p className="text-gray-400">Please grant camera permissions to continue.</p>
                </div>
            )}

          <AnimatePresence>
            {(isLoading || aiResponse) && (
              <motion.div
                className="absolute bottom-4 left-4 right-4 z-10"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{ duration: 0.3 }}
              >
                <div className="max-h-48 overflow-y-auto rounded-lg" style={{ scrollbarWidth: 'none' }}>
                  <AnswerBox isLoading={isLoading} response={aiResponse} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        
        <footer className="z-10 bg-black/50">
          {imagePreview && !aiResponse && !isLoading && (
              <div className="p-4 pt-2">
                   <Textarea
                      placeholder="Ask a question about the image... (optional)"
                      value={question}
                      onChange={(e) => setQuestion(e.target.value)}
                      className="resize-none bg-gray-900 border-gray-700 text-white placeholder:text-gray-400 focus:ring-accent"
                      rows={2}
                  />
              </div>
          )}

          <div className="flex items-center justify-around p-4">
              <Button variant="ghost" size="icon" className="h-16 w-16 rounded-full text-white/80 hover:text-white hover:bg-white/10 disabled:text-white/40" onClick={() => fileInputRef.current?.click()} disabled={!!imagePreview}>
                  <Upload className="h-8 w-8" />
                  <span className="sr-only">Upload</span>
              </Button>
               <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageChange}
                  accept="image/*"
                  className="hidden"
                  disabled={!!imagePreview}
              />
              <Button 
                  variant="outline" 
                  className="h-20 w-20 p-1 rounded-full border-4 border-white bg-transparent hover:bg-white/10 disabled:opacity-50"
                  onClick={handleSnap}
                  disabled={!!imagePreview || !hasCameraPermission}
              >
                <div className="h-full w-full rounded-full bg-white"></div>
                <span className="sr-only">Snap photo</span>
              </Button>
              <Button variant="ghost" size="icon" className="h-16 w-16 rounded-full text-white/80 hover:text-white hover:bg-white/10 disabled:text-white/40" onClick={handleAskAi} disabled={isLoading || !imagePreview}>
                  {isLoading ? (
                      <Loader2 className="h-8 w-8 animate-spin" />
                  ) : (
                      <Sparkles className="h-8 w-8 text-accent" />
                  )}
                  <span className="sr-only">Ask AI</span>
              </Button>
          </div>
        </footer>
      </div>
    </main>
  );
}
