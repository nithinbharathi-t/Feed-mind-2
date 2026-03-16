"use client";

import * as React from "react";
import { Palette } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

const themes = [
  { value: "default", label: "Midnight Blue", color: "bg-[hsl(239,84%,67%)]" },
  { value: "ocean", label: "Ocean", color: "bg-[hsl(188,95%,50%)]" },
  { value: "sunset", label: "Sunset", color: "bg-[hsl(25,95%,58%)]" },
  { value: "forest", label: "Forest", color: "bg-[hsl(142,76%,45%)]" },
  { value: "lavender", label: "Lavender Dream", color: "bg-[hsl(270,80%,65%)]" },
  { value: "cyber", label: "Cyber", color: "bg-[hsl(120,100%,50%)]" },
  { value: "rose", label: "Rose Gold", color: "bg-[hsl(345,75%,60%)]" },
  { value: "amber", label: "Amber Glow", color: "bg-[hsl(45,93%,58%)]" },
  { value: "nordic", label: "Nordic", color: "bg-[hsl(210,70%,60%)]" },
];

export function ThemeSwitcher() {
  const [currentTheme, setCurrentTheme] = React.useState("default");

  React.useEffect(() => {
    // Load theme from localStorage on mount
    const savedTheme = localStorage.getItem("theme") || "default";
    setCurrentTheme(savedTheme);
    applyTheme(savedTheme);
  }, []);

  const applyTheme = (theme: string) => {
    if (theme === "default") {
      document.documentElement.removeAttribute("data-theme");
    } else {
      document.documentElement.setAttribute("data-theme", theme);
    }
  };

  const handleThemeChange = (theme: string) => {
    setCurrentTheme(theme);
    localStorage.setItem("theme", theme);
    applyTheme(theme);
  };

  const currentThemeLabel = themes.find(t => t.value === currentTheme)?.label || "Theme";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Palette className="h-5 w-5" />
          <span className="sr-only">Switch theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <div className="px-2 py-1.5 text-sm font-semibold">Choose Theme</div>
        {themes.map((theme) => (
          <DropdownMenuItem
            key={theme.value}
            onClick={() => handleThemeChange(theme.value)}
            className="flex items-center gap-3 cursor-pointer"
          >
            <div className={`w-4 h-4 rounded-full ${theme.color} ring-1 ring-white/20`} />
            <span className="flex-1">{theme.label}</span>
            {currentTheme === theme.value && (
              <span className="text-primary">✓</span>
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
