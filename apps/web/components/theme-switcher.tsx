"use client";

import { useEffect, useState, startTransition } from "react";
import { Palette, Moon, Sun, Gamepad2 } from "lucide-react";
import { useStyle } from "@/app/style-provider";
import { useTheme } from "next-themes"; // Assuming you use next-themes!
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export function ThemeSwitcher() {
  const [mounted, setMounted] = useState(false);
  const { style, setStyle } = useStyle();
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    startTransition(() => {
      setMounted(true);
    });
  }, []);

  // Skeleton to prevent layout shift before hydration
  if (!mounted) {
    return <div className="size-10 rounded-full bg-muted animate-pulse" />;
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        {/* The beautiful, small circular floating icon */}
        <Button
          variant="outline"
          size="icon"
          className="cursor-pointer rounded-full size-10 shadow-sm bg-background border-ui"
        >
          <Palette className="size-5 text-foreground" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-64 flex flex-col gap-6" align="end">
        {/* AESTHETIC TOGGLE */}
        <div className="flex flex-col gap-3">
          <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Aesthetic
          </Label>
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant={style === "corporate" ? "default" : "outline"}
              size="sm"
              onClick={() => setStyle("corporate")}
              className="w-full cursor-pointer"
            >
              Corporate
            </Button>
            <Button
              variant={style === "retro" ? "default" : "outline"}
              size="sm"
              onClick={() => setStyle("retro")}
              className="w-full"
            >
              Retro
            </Button>
          </div>
        </div>

        {/* COLOR MODE TOGGLE */}
        <div className="flex flex-col gap-3">
          <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Color Mode
          </Label>
          <div className="grid grid-cols-3 gap-2">
            <Button
              variant={theme === "light" ? "default" : "outline"}
              size="icon"
              onClick={() => setTheme("light")}
              className="w-full cursor-pointer"
            >
              <Sun className="size-4" />
            </Button>
            <Button
              variant={theme === "dark" ? "default" : "outline"}
              size="icon"
              onClick={() => setTheme("dark")}
              className="w-full cursor-pointer"
            >
              <Moon className="size-4" />
            </Button>
            <Button
              variant={theme === "retro" ? "default" : "outline"}
              size="icon"
              onClick={() => setTheme("retro")}
              className="w-full cursor-pointer"
            >
              <Gamepad2 className="size-4" />
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
