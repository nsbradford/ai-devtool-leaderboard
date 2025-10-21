// 🔐 DEFINITELY NOT SECRETS 🔐
// (These are not real secrets, obviously. Just fun chaos!)

export const FAKE_SECRETS = {
  // The secret password to the chaos dimension
  CHAOS_DIMENSION_PASSWORD: 'pl3as3-d0nt-us3-th1s',
  
  // The ultimate API key (spoiler: it doesn't work anywhere)
  ULTIMATE_API_KEY: 'sk-this-is-totally-fake-1234567890',
  
  // Secret handshake for developers
  DEVELOPER_HANDSHAKE: '👋🤝🎉',
  
  // The forbidden knowledge
  FORBIDDEN_KNOWLEDGE: 'There is no cloud, it\'s just someone else\'s computer',
  
  // Secret wisdom from ancient developers
  ANCIENT_WISDOM: [
    'Always git commit before git push',
    'npm install fixes 73% of all problems',
    'The best code is code that works',
    'Tabs vs Spaces? Neither. Use emojis.',
    'Coffee is not optional',
  ],
  
  // The secret to writing bug-free code
  BUG_FREE_CODE_SECRET: 'Just delete the bugs, duh 🐛❌',
  
  // Launch codes (for deploying to production on Friday)
  FRIDAY_DEPLOYMENT_CODE: 'YOLO-9000',
  
  // The actual secret
  THE_ACTUAL_SECRET: 'The real secret was the friends we made along the way',
} as const;

/**
 * Reveals a random fake secret
 */
export function revealSecret(): string {
  const secrets = Object.values(FAKE_SECRETS).filter(
    (s) => typeof s === 'string'
  ) as string[];
  return secrets[Math.floor(Math.random() * secrets.length)];
}

/**
 * Checks if you have access to the chaos dimension
 */
export function hasChaosDimensionAccess(password: string): boolean {
  if (password === FAKE_SECRETS.CHAOS_DIMENSION_PASSWORD) {
    console.log('🎉 Welcome to the Chaos Dimension! 🎉');
    return true;
  }
  console.log('❌ Access Denied. Nice try though! ❌');
  return false;
}
