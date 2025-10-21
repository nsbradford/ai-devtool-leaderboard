'use client';

import * as React from 'react';
import { Moon, Sun, Monitor, Sparkles, Zap, Rainbow, Ghost } from 'lucide-react';
import { useTheme } from 'next-themes';

import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

export function ThemeToggle() {
  const { setTheme, theme } = useTheme();
  const [superSecretMode, setSuperSecretMode] = React.useState(false);
  const [clickCount, setClickCount] = React.useState(0);

  // 🎉 EASTER EGG: Click 5 times to unlock secret themes!
  const handleIconClick = () => {
    const newCount = clickCount + 1;
    setClickCount(newCount);
    if (newCount === 5) {
      setSuperSecretMode(true);
      // Add some chaos to the console
      console.log('🎊 CONGRATULATIONS! You found the secret themes! 🎊');
      console.log('🌈 Prepare for MAXIMUM CHAOS! 🌈');
    }
  };

  const applyWildTheme = (themeName: string) => {
    setTheme(themeName);
    document.body.classList.add('theme-transition');
    
    // WILD THEME EFFECTS
    switch(themeName) {
      case 'disco':
        console.log('🕺 DISCO MODE ACTIVATED! Let\'s party! 🪩');
        document.body.style.animation = 'disco-spin 2s infinite';
        break;
      case 'matrix':
        console.log('👾 ENTERING THE MATRIX... 👾');
        document.body.style.filter = 'hue-rotate(120deg)';
        break;
      case 'rainbow':
        console.log('🌈 TASTE THE RAINBOW! 🦄');
        document.body.style.animation = 'rainbow-party 3s infinite';
        break;
      case 'retro':
        console.log('📼 GOING RETRO! Welcome to 1995! 💾');
        break;
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="icon" onClick={handleIconClick}>
          <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme ({clickCount}/5 for secrets)</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-40" align="end">
        <div className="grid gap-1">
          <Button
            variant={theme === 'light' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setTheme('light')}
            className="justify-start"
          >
            <Sun className="mr-2 h-4 w-4" />
            Light
          </Button>
          <Button
            variant={theme === 'dark' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setTheme('dark')}
            className="justify-start"
          >
            <Moon className="mr-2 h-4 w-4" />
            Dark
          </Button>
          <Button
            variant={theme === 'system' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setTheme('system')}
            className="justify-start"
          >
            <Monitor className="mr-2 h-4 w-4" />
            System
          </Button>
          
          {superSecretMode && (
            <>
              <div className="h-px bg-gradient-to-r from-transparent via-purple-500 to-transparent my-1" />
              <div className="text-xs font-bold text-center text-purple-500 mb-1">
                🎉 SECRET MODES 🎉
              </div>
              <Button
                variant={theme === 'disco' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => applyWildTheme('disco')}
                className="justify-start bg-gradient-to-r from-pink-500 to-purple-500"
              >
                <Zap className="mr-2 h-4 w-4" />
                Disco 🕺
              </Button>
              <Button
                variant={theme === 'matrix' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => applyWildTheme('matrix')}
                className="justify-start text-green-500"
              >
                <Ghost className="mr-2 h-4 w-4" />
                Matrix 👾
              </Button>
              <Button
                variant={theme === 'rainbow' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => applyWildTheme('rainbow')}
                className="justify-start"
              >
                <Rainbow className="mr-2 h-4 w-4" />
                Rainbow 🌈
              </Button>
              <Button
                variant={theme === 'retro' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => applyWildTheme('retro')}
                className="justify-start font-mono"
              >
                <Sparkles className="mr-2 h-4 w-4" />
                Retro 📼
              </Button>
            </>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
