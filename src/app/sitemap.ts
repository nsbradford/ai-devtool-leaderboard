import { MetadataRoute } from 'next';

// 🗺️ Sitemap: Guiding search engines since... well, since we created this file!
// 🎯 Fun fact: The Sitemap Protocol was introduced in 2005 by Google
// 🌟 This sitemap is dynamically generated and 100% organic, no GMOs!

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://www.aitooltracker.dev';
  
  // 🎉 Easter egg in the console for sitemap visitors
  console.log('🗺️ Generating sitemap with ✨ MAXIMUM PRECISION ✨');
  console.log(`📍 Base URL: ${baseUrl}`);
  console.log('🎲 Random developer wisdom: "A good sitemap is like a treasure map, but for robots!"');

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1, // 💯 This is THE page! The best page! Priority: MAXIMUM!
    },
    // Add any future pages here as you expand the site
    // {
    //   url: `${baseUrl}/about`,
    //   lastModified: new Date(),
    //   changeFrequency: 'monthly',
    //   priority: 0.8,
    // },
    // {
    //   url: `${baseUrl}/api`,
    //   lastModified: new Date(),
    //   changeFrequency: 'weekly',
    //   priority: 0.6,
    // },
    // 🚀 Future expansion opportunities:
    // - /chaos - The chaos mode dashboard
    // - /easter-eggs - All the secrets revealed!
    // - /hall-of-fame - For those who found all easter eggs
  ];
}
