'use client';

import { useState, useEffect } from 'react';
import { Sparkles, Zap, Flame, Ghost, Skull, Rocket } from 'lucide-react';
import { Button } from '@/components/ui/button';

// 🎪 THE CHAOS BUTTON: For when you want to add some SPICE to your dashboard!
// ⚠️ WARNING: This button may cause unexpected side effects including:
// - Sudden bursts of confetti (metaphorically)
// - Random color changes
// - Unpredictable animations
// - A general sense of digital mayhem

const chaosIcons = [Sparkles, Zap, Flame, Ghost, Skull, Rocket];
const chaosMessages = [
  '💥 CHAOS UNLEASHED!',
  '🌪️ MAYHEM ACTIVATED!',
  '🎪 PANDEMONIUM MODE!',
  '🎯 ANARCHY ENGAGED!',
  '⚡ BEDLAM INITIATED!',
  '🔥 TURMOIL TRIGGERED!',
  '💫 DISORDER DEPLOYED!',
  '🌈 MADNESS MOBILIZED!',
];

export function ChaosButton() {
  const [chaosLevel, setChaosLevel] = useState(0);
  const [message, setMessage] = useState('Click for Chaos');
  const [isShaking, setIsShaking] = useState(false);
  const [currentIcon, setCurrentIcon] = useState(0);

  useEffect(() => {
    if (chaosLevel > 0) {
      // Rotate icons rapidly during chaos
      const iconInterval = setInterval(() => {
        setCurrentIcon((prev) => (prev + 1) % chaosIcons.length);
      }, 200);

      // Reset after chaos
      const timeout = setTimeout(() => {
        setChaosLevel(0);
        setMessage('Click for Chaos');
      }, 3000);

      return () => {
        clearInterval(iconInterval);
        clearTimeout(timeout);
      };
    }
  }, [chaosLevel]);

  const unleashChaos = () => {
    const newLevel = chaosLevel + 1;
    setChaosLevel(newLevel);
    setMessage(chaosMessages[Math.floor(Math.random() * chaosMessages.length)]);
    setIsShaking(true);
    
    // Shake effect
    setTimeout(() => setIsShaking(false), 500);

    // Log chaos to console
    console.log(`🎪 CHAOS LEVEL ${newLevel} ACTIVATED!`);
    console.log('🎲 Rolling for random events...');
    
    // Random chaos effects
    if (Math.random() > 0.5) {
      console.log('✨ You found a secret message: "Keep coding, you beautiful human!"');
    }
    
    if (newLevel >= 5) {
      console.log('🚨 MAXIMUM CHAOS ACHIEVED! 🚨');
      console.log('🏆 Achievement Unlocked: Chaos Master!');
    }

    // Make the whole page do something wild
    if (newLevel >= 3) {
      document.body.style.transition = 'transform 0.5s';
      document.body.style.transform = 'rotate(1deg)';
      setTimeout(() => {
        document.body.style.transform = 'rotate(-1deg)';
        setTimeout(() => {
          document.body.style.transform = 'rotate(0deg)';
        }, 250);
      }, 250);
    }
  };

  const IconComponent = chaosIcons[currentIcon];

  return (
    <Button
      onClick={unleashChaos}
      className={`
        relative overflow-hidden
        ${isShaking ? 'animate-shake' : ''}
        ${chaosLevel > 0 ? 'animate-pulse-rainbow' : ''}
        bg-gradient-to-r from-purple-500 via-pink-500 to-red-500
        hover:from-purple-600 hover:via-pink-600 hover:to-red-600
        text-white font-bold
        transition-all duration-300
      `}
      style={{
        transform: chaosLevel > 0 ? `scale(${1 + chaosLevel * 0.1})` : 'scale(1)',
      }}
    >
      <IconComponent className="mr-2 h-4 w-4" />
      {message}
      {chaosLevel > 0 && (
        <span className="ml-2 text-xs">
          Lv.{chaosLevel}
        </span>
      )}
    </Button>
  );
}
