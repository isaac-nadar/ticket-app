"use client";

import { useTheme } from "next-themes";
import { useUiStyle } from "@/app/style-provider";
import { useEffect, useState } from "react";

export function ThemeSwitcher() {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();
  const { uiStyle, setUiStyle } = useUiStyle();

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  return (
    <div className="flex flex-col gap-4 bg-card border-ui border-border rounded-ui shadow-ui p-4 w-72 transition-all">
      {/* COLOR THEME TOGGLES */}
      <div>
        <h3 className="text-sm font-bold text-foreground mb-2 uppercase tracking-widest">
          Color Palette
        </h3>
        <div className="flex gap-2">
          {["light", "dark", "retro"].map((t) => (
            <button
              key={t}
              onClick={() => setTheme(t)}
              className={`flex-1 py-1 text-sm border-ui rounded-ui transition-all ${
                theme === t
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-transparent text-foreground border-border hover:bg-background"
              }`}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* UI STYLE TOGGLES */}
      <div>
        <h3 className="text-sm font-bold text-foreground mb-2 uppercase tracking-widest">
          UI Style
        </h3>
        <div className="flex gap-2">
          <button
            onClick={() => setUiStyle("corporate")}
            className={`flex-1 py-1 text-sm border-ui rounded-ui transition-all ${
              uiStyle === "corporate"
                ? "bg-foreground text-background border-foreground"
                : "bg-transparent text-foreground border-border hover:bg-background"
            }`}
          >
            Corporate
          </button>
          <button
            onClick={() => setUiStyle("retro")}
            className={`flex-1 py-1 text-sm border-ui rounded-ui transition-all ${
              uiStyle === "retro"
                ? "bg-foreground text-background border-foreground"
                : "bg-transparent text-foreground border-border hover:bg-background"
            }`}
          >
            Retro 90s
          </button>
        </div>
      </div>
    </div>
  );
}
