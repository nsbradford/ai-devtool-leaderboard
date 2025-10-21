'use client';

import { useState, useEffect } from 'react';

/**
 * 🥚 SECRET EASTER EGG COMPONENT 🥚
 * 
 * This component listens for the Konami Code and unleashes MADNESS
 * Up, Up, Down, Down, Left, Right, Left, Right, B, A
 */

export function EasterEgg() {
  const [konamiIndex, setKonamiIndex] = useState(0);
  const [activated, setActivated] = useState(false);
  
  const konamiCode = [
    'ArrowUp', 'ArrowUp', 
    'ArrowDown', 'ArrowDown',
    'ArrowLeft', 'ArrowRight', 
    'ArrowLeft', 'ArrowRight',
    'b', 'a'
  ];

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === konamiCode[konamiIndex]) {
        setKonamiIndex(konamiIndex + 1);
        
        if (konamiIndex + 1 === konamiCode.length) {
          setActivated(true);
          setKonamiIndex(0);
          
          // Reset after 10 seconds
          setTimeout(() => setActivated(false), 10000);
        }
      } else {
        setKonamiIndex(0);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [konamiIndex]);

  if (!activated) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {/* Rainbow background pulse */}
      <div 
        className="absolute inset-0 animate-pulse"
        style={{
          background: 'linear-gradient(45deg, rgba(255,0,0,0.3), rgba(255,127,0,0.3), rgba(255,255,0,0.3), rgba(0,255,0,0.3), rgba(0,0,255,0.3), rgba(75,0,130,0.3), rgba(148,0,211,0.3))',
          backgroundSize: '400% 400%',
          animation: 'rainbow 3s ease infinite'
        }}
      />
      
      {/* Floating emojis */}
      <div className="absolute inset-0">
        {Array.from({ length: 50 }).map((_, i) => (
          <div
            key={i}
            className="absolute text-4xl animate-bounce"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 2}s`,
              animationDuration: `${1 + Math.random() * 2}s`
            }}
          >
            {['🎉', '🎊', '✨', '🌟', '💫', '⭐', '🔥', '🚀', '🦄', '🌈'][Math.floor(Math.random() * 10)]}
          </div>
        ))}
      </div>

      {/* Center message */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-6xl font-bold text-white drop-shadow-lg animate-bounce">
          🎮 KONAMI CODE ACTIVATED! 🎮
        </div>
      </div>
    </div>
  );
}
