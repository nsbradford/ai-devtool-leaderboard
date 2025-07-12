"use client"

import * as React from "react"
import { Moon, Sun, Monitor } from "lucide-react"
import { useTheme } from "next-themes"

import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

export function ThemeToggle() {
  const { setTheme, theme } = useTheme()

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="icon">
          <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-40" align="end">
        <div className="grid gap-1">
          <Button
            variant={theme === "light" ? "default" : "ghost"}
            size="sm"
            onClick={() => setTheme("light")}
            className="justify-start"
          >
            <Sun className="mr-2 h-4 w-4" />
            Light
          </Button>
          <Button
            variant={theme === "dark" ? "default" : "ghost"}
            size="sm"
            onClick={() => setTheme("dark")}
            className="justify-start"
          >
            <Moon className="mr-2 h-4 w-4" />
            Dark
          </Button>
          <Button
            variant={theme === "system" ? "default" : "ghost"}
            size="sm"
            onClick={() => setTheme("system")}
            className="justify-start"
          >
            <Monitor className="mr-2 h-4 w-4" />
            System
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
