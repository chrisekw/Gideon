
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { ThemeSwitcher } from "@/components/gideon/theme-switcher";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";

export default function SettingsPage() {
  // TODO: Implement history clearing functionality
  const handleClearHistory = () => {
    alert("History clearing is not yet implemented.");
  };

  return (
    <div className="flex-1 p-4 md:p-8">
        <Card className="w-full max-w-2xl mx-auto">
            <CardHeader>
                <CardTitle>Settings</CardTitle>
                <CardDescription>
                    Manage your application settings and preferences.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              <div className="space-y-4">
                <div className="space-y-1">
                  <h3 className="text-lg font-semibold">Appearance</h3>
                  <p className="text-sm text-muted-foreground">
                    Customize the look and feel of the app.
                  </p>
                </div>
                <ThemeSwitcher />
              </div>
              
              <Separator />

              <div className="space-y-4">
                 <div className="space-y-1">
                  <h3 className="text-lg font-semibold">Data & Privacy</h3>
                  <p className="text-sm text-muted-foreground">
                    Manage your data and privacy settings.
                  </p>
                </div>
                 <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                        <h4 className="font-medium">Clear History</h4>
                        <p className="text-xs text-muted-foreground">This will permanently delete all your past analysis history.</p>
                    </div>
                    <Button variant="destructive" onClick={handleClearHistory}>
                        Clear
                    </Button>
                </div>
              </div>
            </CardContent>
        </Card>
    </div>
  );
}
