import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Settings } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
            <CardHeader>
                <div className="mx-auto bg-primary/10 p-3 rounded-full mb-4">
                    <Settings className="h-8 w-8 text-primary" />
                </div>
                <CardTitle>Settings</CardTitle>
                <CardDescription>
                    This feature is coming soon. You'll be able to manage your preferences here.
                </CardDescription>
            </CardHeader>
        </Card>
    </div>
  )
}
