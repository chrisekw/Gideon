
"use client"

import { useTheme } from "next-themes"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Sun, Moon, Laptop } from "lucide-react"
import { useEffect, useState } from "react"

export function ThemeSwitcher() {
  const [mounted, setMounted] = useState(false)
  const { theme, setTheme } = useTheme()

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null
  }

  return (
    <RadioGroup value={theme} onValueChange={setTheme} className="grid grid-cols-3 gap-4">
      <div>
        <RadioGroupItem value="light" id="light" className="peer sr-only" />
        <Label htmlFor="light" className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">
          <Sun className="h-6 w-6 mb-2" />
          Light
        </Label>
      </div>
      <div>
        <RadioGroupItem value="dark" id="dark" className="peer sr-only" />
        <Label htmlFor="dark" className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">
          <Moon className="h-6 w-6 mb-2" />
          Dark
        </Label>
      </div>
      <div>
        <RadioGroupItem value="system" id="system" className="peer sr-only" />
        <Label htmlFor="system" className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">
          <Laptop className="h-6 w-6 mb-2" />
          System
        </Label>
      </div>
    </RadioGroup>
  )
}
