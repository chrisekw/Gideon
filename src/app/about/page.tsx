import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Info, Sparkles, Bot, BrainCircuit } from "lucide-react";

export default function AboutPage() {
  return (
    <div className="flex-1 p-4 md:p-8">
        <Card className="w-full max-w-2xl mx-auto">
            <CardHeader className="text-center">
                <div className="mx-auto bg-primary/10 p-3 rounded-full mb-4 w-fit">
                    <Bot className="h-10 w-10 text-primary" />
                </div>
                <CardTitle>About GiDEON</CardTitle>
                <CardDescription>
                    Your intelligent visual assistant for understanding the world around you.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 text-sm">
                <p>
                    GiDEON is a powerful multimodal AI visual assistant designed to help you identify, understand, and explore real-world entities. By combining state-of-the-art visual recognition with advanced AI reasoning, GiDEON can analyze images you provide and offer detailed, accurate information.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-start gap-4 p-4 rounded-lg bg-secondary/50">
                    <Sparkles className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold">Identify Anything</h4>
                      <p className="text-muted-foreground">From plants and animals to landmarks and everyday objects, just snap a photo and let GiDEON tell you what it is.</p>
                    </div>
                  </div>
                   <div className="flex items-start gap-4 p-4 rounded-lg bg-secondary/50">
                    <BrainCircuit className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold">Context-Aware</h4>
                      <p className="text-muted-foreground">Using optional location data, GiDEON provides more accurate identifications for landmarks and geographically specific subjects.</p>
                    </div>
                  </div>
                </div>
                 <div className="text-center pt-4 text-xs text-muted-foreground">
                    <p>GiDEON v1.0</p>
                    <p>Powered by Google's Gemini models.</p>
                </div>
            </CardContent>
        </Card>
    </div>
  )
}
