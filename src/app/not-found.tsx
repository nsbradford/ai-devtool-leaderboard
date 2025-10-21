// 🔍 404 - The Page That Got Away
// Or did it ever exist? 🤔

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { generateRandomExcuse } from '@/lib/utils';
import { getRandomCodingQuote } from '@/lib/chaos-mode';

export default function NotFound() {
  const [excuse, setExcuse] = useState<string>('');
  const [quote, setQuote] = useState<string>('');
  const [clicks, setClicks] = useState(0);

  useEffect(() => {
    setExcuse(generateRandomExcuse());
    setQuote(getRandomCodingQuote());
  }, []);

  const handleExcuseClick = () => {
    setExcuse(generateRandomExcuse());
    setClicks(clicks + 1);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="max-w-2xl w-full text-center space-y-8">
        {/* Giant 404 */}
        <div className="relative">
          <h1 className="text-9xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-blue-600 dark:from-purple-400 dark:to-blue-400">
            404
          </h1>
          <div className="absolute inset-0 blur-3xl opacity-30 bg-gradient-to-r from-purple-600 to-blue-600" />
        </div>

        {/* Main message */}
        <div className="space-y-4">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Oops! Page Not Found
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            The page you&apos;re looking for seems to have wandered off into the void.
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-500 italic">
            (Or maybe it never existed? The mysteries of the web... 🤔)
          </p>
        </div>

        {/* Random excuse */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-xl border-2 border-purple-200 dark:border-purple-800">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
            Why is this page missing?
          </p>
          <p className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            {excuse}
          </p>
          <button
            onClick={handleExcuseClick}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-md transition-colors"
          >
            Get Another Excuse
          </button>
          {clicks >= 5 && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              You&apos;ve clicked {clicks} times. Are you procrastinating? 😏
            </p>
          )}
          {clicks >= 10 && (
            <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">
              Achievement Unlocked: Excuse Collector! 🏆
            </p>
          )}
        </div>

        {/* Random quote */}
        <div className="bg-blue-50 dark:bg-gray-700 rounded-lg p-6 border-l-4 border-blue-600">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
            While you&apos;re here, here&apos;s a coding quote:
          </p>
          <p className="text-sm italic text-gray-700 dark:text-gray-300">
            &quot;{quote}&quot;
          </p>
        </div>

        {/* Navigation options */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link
            href="/"
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold rounded-lg shadow-lg transition-all transform hover:scale-105"
          >
            Take Me Home
          </Link>
          <button
            onClick={() => window.history.back()}
            className="px-6 py-3 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-gray-100 font-semibold rounded-lg transition-colors"
          >
            Go Back
          </button>
        </div>

        {/* Fun facts */}
        <div className="text-xs text-gray-400 dark:text-gray-600 space-y-1">
          <p>🎲 Fun fact: 404 is named after room 404 at CERN (not really, but sounds cool)</p>
          <p>🔍 Pro tip: Check the URL for typos. We all make them!</p>
          <p>💡 Secret: Try the Konami code on the homepage! ↑↑↓↓←→←→BA</p>
        </div>

        {/* ASCII art for fun */}
        <pre className="text-xs text-gray-400 dark:text-gray-600 font-mono hidden sm:block">
          {`
    ¯\\_(ツ)_/¯
    
    "I looked everywhere
     but couldn't find
     your page!"
          `}
        </pre>
      </div>
    </div>
  );
}
