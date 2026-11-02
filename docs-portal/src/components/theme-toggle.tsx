'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';

export function CustomThemeSwitch() {
  const { setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const currentTheme = mounted ? resolvedTheme : 'light';

  return (
    <div className="w-full">
      <div className="h-[1px] w-full bg-fd-border/80 my-2.5" />
      <div className="flex items-center justify-between w-full px-1 text-sm text-fd-muted-foreground font-medium">
        <div className="flex items-center gap-2.5">
          <span className="font-semibold text-sm text-fd-muted-foreground">Theme</span>
          <span className="text-fd-muted-foreground/30 font-light">|</span>
        </div>
        <div className="theme-toggle-pill inline-flex items-center rounded-full border border-fd-border p-0.5 bg-transparent ms-auto">
          <button
            type="button"
            aria-label="Light mode"
            onClick={() => setTheme('light')}
            className={`p-1.5 rounded-full transition-all duration-150 ${
              currentTheme === 'light'
                ? 'bg-fd-accent text-fd-foreground font-bold shadow-xs'
                : 'text-fd-muted-foreground/60 hover:text-fd-foreground'
            }`}
          >
            <Sun className="size-4 fill-current" />
          </button>
          <button
            type="button"
            aria-label="Dark mode"
            onClick={() => setTheme('dark')}
            className={`p-1.5 rounded-full transition-all duration-150 ${
              currentTheme === 'dark'
                ? 'bg-fd-accent text-fd-foreground font-bold shadow-xs'
                : 'text-fd-muted-foreground/60 hover:text-fd-foreground'
            }`}
          >
            <Moon className="size-4 fill-current" />
          </button>
        </div>
      </div>
    </div>
  );
}
