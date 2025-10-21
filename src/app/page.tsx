'use client';

import LeaderboardChart from '@/components/LeaderboardChart';
import { useEffect, useState } from 'react';
import { getRandomMantra, RAINBOW_COLORS } from '@/lib/constants';

export default function Home() {
  const [konami, setKonami] = useState(false);
  const [shakeIt, setShakeIt] = useState(false);
  const [rainbowMode, setRainbowMode] = useState(false);
  const [mantra, setMantra] = useState('');
  
  // 🎮 KONAMI CODE EASTER EGG: ↑ ↑ ↓ ↓ ← → ← → B A
  useEffect(() => {
    const konamiCode = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 
                        'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
    let konamiIndex = 0;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === konamiCode[konamiIndex]) {
        konamiIndex++;
        if (konamiIndex === konamiCode.length) {
          setKonami(true);
          setMantra(getRandomMantra());
          console.log('🎮 KONAMI CODE ACTIVATED! 🎮');
          console.log('🌟 You are now a certified code wizard! 🧙‍♂️');
          konamiIndex = 0;
          
          // Trigger MAXIMUM CHAOS
          setShakeIt(true);
          setTimeout(() => setShakeIt(false), 1000);
        }
      } else {
        konamiIndex = 0;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // 🌈 RAINBOW MODE: Press R key
  useEffect(() => {
    const handleRainbow = (e: KeyboardEvent) => {
      if (e.key === 'r' && e.shiftKey) {
        setRainbowMode(!rainbowMode);
        console.log(`🌈 Rainbow mode ${!rainbowMode ? 'ACTIVATED' : 'DEACTIVATED'}!`);
      }
    };
    
    window.addEventListener('keydown', handleRainbow);
    return () => window.removeEventListener('keydown', handleRainbow);
  }, [rainbowMode]);

  // 🎨 Rainbow animation
  useEffect(() => {
    if (rainbowMode) {
      let colorIndex = 0;
      const interval = setInterval(() => {
        document.body.style.backgroundColor = RAINBOW_COLORS[colorIndex];
        colorIndex = (colorIndex + 1) % RAINBOW_COLORS.length;
      }, 200);
      return () => {
        clearInterval(interval);
        document.body.style.backgroundColor = '';
      };
    }
  }, [rainbowMode]);

  return (
    <div className={shakeIt ? 'animate-shake' : ''}>
      {konami && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 text-white text-center py-2 font-bold animate-pulse">
          🎉 KONAMI CODE ACTIVATED! 🎉 {mantra}
        </div>
      )}
      
      {/* 🚀 Secret hints in HTML comments */}
      {/* Try the Konami code: ↑ ↑ ↓ ↓ ← → ← → B A */}
      {/* Press Shift+R for Rainbow Mode! */}
      {/* Click the theme toggle 5 times for secret themes! */}
      
      <LeaderboardChart />
      
      {/* 🎪 Floating chaos indicator */}
      {(konami || rainbowMode) && (
        <div className="fixed bottom-4 right-4 bg-black/80 text-white px-4 py-2 rounded-lg shadow-lg">
          <div className="text-sm font-mono">
            <div>🎮 Konami: {konami ? '✅' : '❌'}</div>
            <div>🌈 Rainbow: {rainbowMode ? '✅' : '❌'}</div>
          </div>
        </div>
      )}
    </div>
  );
}
