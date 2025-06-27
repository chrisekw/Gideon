import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { ThemeSwitcher } from "./theme-switcher";

export default function SettingsPage() {
  return (
    <div className="flex-1 p-4 md:p-8">
        <Card className="w-full max-w-2xl mx-auto">
            <CardHeader>
                <CardTitle>Settings</CardTitle>
                <CardDescription>
                    Manage your application settings and preferences.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">Appearance</h3>
                <p className="text-sm text-muted-foreground">
                  Customize the look and feel of the app.
                </p>
              </div>
              <ThemeSwitcher />
            </CardContent>
        </Card>
    </div>
  )
}
