import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

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

type AnswerBoxProps = {
  isLoading: boolean;
  title: string;
  icon: React.ReactNode;
  response: string;
  products?: Product[] | null;
  sources?: Source[] | null;
};

export default function AnswerBox({ isLoading, title, icon, response, products, sources }: AnswerBoxProps) {
  const showSkeleton = isLoading && !response && (!products || products.length === 0) && (!sources || sources.length === 0);

  if (showSkeleton) {
     return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                AI Analysis
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-4/5" />
                </div>
            </CardContent>
        </Card>
     )
  }

  const hasContent = response || (products && products.length > 0) || (sources && sources.length > 0);
  if (!hasContent) {
    return null;
  }
  
  return (
    <Card className="animate-in fade-in duration-500">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
           {icon}
           {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {response && (
            <div className="max-w-none whitespace-pre-wrap text-sm leading-relaxed">
                {response}
            </div>
        )}
        {products && products.length > 0 && (
            <div className={cn("space-y-3", response && "mt-4")}>
                {products.map((product, index) => (
                    <a key={index} href={product.link} target="_blank" rel="noopener noreferrer" className="block p-4 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors">
                        <div className="flex justify-between items-start gap-4">
                            <div>
                                <p className="font-semibold text-primary">{product.name}</p>
                                <p className="text-sm text-muted-foreground">{product.brand}</p>
                            </div>
                            <p className="font-bold text-lg text-right whitespace-nowrap">{product.price}</p>
                        </div>
                    </a>
                ))}
            </div>
        )}
        {sources && sources.length > 0 && (
            <div className={cn("space-y-3", (response || (products && products.length > 0)) && "mt-4")}>
                <h4 className="font-semibold text-base">Sources</h4>
                <div className="space-y-2">
                    {sources.map((source, index) => (
                         <a key={index} href={source.link} target="_blank" rel="noopener noreferrer" className="block p-3 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors text-sm">
                             <p className="font-medium text-primary hover:underline">{source.title}</p>
                         </a>
                    ))}
                </div>
            </div>
        )}
      </CardContent>
    </Card>
  );
}
