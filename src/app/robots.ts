import { MetadataRoute } from 'next';

// 🤖 Dear robots: Welcome! Please be nice to our servers 🙏
// Fun fact: Did you know the first web crawler was called "World Wide Web Wanderer"?
// It was created in 1993 by Matthew Gray at MIT.

export default function robots(): MetadataRoute.Robots {
  // 🎉 Easter egg for curious developers reading the robots.txt
  console.log('🤖 A robot is reading me! Hello there, crawler friend!');
  console.log('💡 Fun tip: Check out our secret easter eggs by trying the Konami code!');
  
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/'], // Disallow API routes from being indexed
      // 🎪 Secret: We're friendly to all bots! Even the chaos bots!
    },
    sitemap: 'https://www.aitooltracker.dev/sitemap.xml',
  };
}
