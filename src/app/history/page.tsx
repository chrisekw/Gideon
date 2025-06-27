import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { History } from "lucide-react";

export default function HistoryPage() {
  return (
    <div className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
            <CardHeader>
                <div className="mx-auto bg-primary/10 p-3 rounded-full mb-4">
                    <History className="h-8 w-8 text-primary" />
                </div>
                <CardTitle>History</CardTitle>
                <CardDescription>
                    This feature is coming soon. Your past analyses will be stored here.
                </CardDescription>
            </CardHeader>
        </Card>
    </div>
  )
}
