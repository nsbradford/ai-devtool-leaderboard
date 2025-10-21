// 🔮 THE DEVELOPER FORTUNE TELLER 🔮
// Peer into the future of your code... if you dare!

export interface DeveloperFortune {
  fortune: string;
  luckyLanguage: string;
  luckyNumber: number;
  bugPrediction: string;
  coffeeRecommendation: string;
  mood: string;
  advice: string;
}

const FORTUNES = [
  "A bug-free day awaits you... said no one ever.",
  "Your code will compile on the first try! (Check again, just in case)",
  "A merge conflict approaches. Prepare yourself.",
  "Stack Overflow will have all the answers you seek today.",
  "Your rubber duck will speak wisdom to you.",
  "A mysterious '// TODO' will haunt your dreams.",
  "You will discover a forgotten console.log in production.",
  "The tests will pass. The second time. Maybe the third.",
  "A wild semicolon appears in the least expected place!",
  "Your code review will receive only compliments today! 🦄",
  "Legacy code awaits. It knows your name.",
  "The documentation you seek... does not exist.",
  "You will refactor code today and break nothing! (Probably)",
  "A copy-paste error will teach you patience.",
  "Your commit message will be poetry.",
  "The CI/CD pipeline smiles upon you.",
  "A teammate will understand your regex on the first try!",
  "You will fix a bug that existed before you were born.",
  "The production deployment will be smooth as butter... right?",
  "You'll spend 3 hours on a bug. Solution: a missing comma.",
];

const LUCKY_LANGUAGES = [
  "TypeScript", "JavaScript", "Python", "Rust", "Go", "Java",
  "C++", "Ruby", "Swift", "Kotlin", "Elixir", "Haskell",
  "Scala", "Clojure", "F#", "Elm", "Crystal", "Nim",
  "Brainfuck (just kidding... or am I?)", "Assembly (brave today!)"
];

const BUG_PREDICTIONS = [
  "High chance of off-by-one errors",
  "Null pointer exceptions lurk in the shadows",
  "Race conditions may appear unexpectedly",
  "The bugs will be self-documenting",
  "Memory leaks are in your future",
  "A heisenbug appears: disappears when you debug it",
  "Infinite loops beckon (check your termination conditions!)",
  "Type errors await, despite your best efforts",
  "The bug is in the last place you'll look (it always is)",
  "No bugs today! (Said no developer ever)",
  "Bugs will multiply like gremlins after midnight",
  "A CSS alignment issue will test your sanity",
];

const COFFEE_RECOMMENDATIONS = [
  "Triple shot espresso - you'll need it",
  "Americano - straight and to the point",
  "Latte - be gentle with yourself today",
  "Cold brew - pace yourself, it's a marathon",
  "Decaf (lol, just kidding)",
  "Dark roast - face the darkness head-on",
  "Coffee IV drip recommended",
  "Espresso con panna - treat yourself!",
  "Flat white - keep it simple",
  "Affogato - because you deserve nice things",
  "Whatever's in the office pot - desperate times",
  "Energy drink + coffee combo - chaos mode activated",
];

const MOODS = [
  "optimistically debugging",
  "cautiously shipping",
  "aggressively refactoring",
  "peacefully coding",
  "chaotically productive",
  "zen-like despite the errors",
  "coffee-powered",
  "merge conflict warrior",
  "production-ready (maybe)",
  "asynchronously vibing",
  "recursively thinking",
  "git committed (emotionally and literally)",
];

const ADVICE = [
  "Trust your debugger, but verify your assumptions.",
  "The rubber duck knows more than it lets on. Consult it.",
  "Read the error message. Then read it again. Then Google it.",
  "When in doubt, add more logging. When still in doubt, add even more.",
  "The bug is always in the code you're most confident about.",
  "Future you will thank present you for writing that comment.",
  "Push to a branch. Always push to a branch. Never directly to main.",
  "Tests are like vegetables - you know they're good for you.",
  "That 'temporary' hack from 2 years ago? Time to fix it.",
  "Your IDE is trying to help. Listen to its warnings.",
  "Take a break. The solution often appears when you're not looking.",
  "Pair programming with your rubber duck counts as collaboration.",
  "Document your code like you're explaining it to yourself in 6 months.",
  "The best code is code you don't have to write. YAGNI!",
  "Deploy on Tuesday. Never on Friday. This is the way.",
];

/**
 * Generate a fortune for the developer
 */
export function tellDeveloperFortune(): DeveloperFortune {
  return {
    fortune: FORTUNES[Math.floor(Math.random() * FORTUNES.length)],
    luckyLanguage: LUCKY_LANGUAGES[Math.floor(Math.random() * LUCKY_LANGUAGES.length)],
    luckyNumber: Math.floor(Math.random() * 100) + 1,
    bugPrediction: BUG_PREDICTIONS[Math.floor(Math.random() * BUG_PREDICTIONS.length)],
    coffeeRecommendation: COFFEE_RECOMMENDATIONS[Math.floor(Math.random() * COFFEE_RECOMMENDATIONS.length)],
    mood: MOODS[Math.floor(Math.random() * MOODS.length)],
    advice: ADVICE[Math.floor(Math.random() * ADVICE.length)],
  };
}

/**
 * Get a prediction for your Pull Request
 */
export function predictPullRequest(): {
  status: 'approved' | 'changes-requested' | 'commented' | 'chaos';
  prediction: string;
  confidence: number;
} {
  const random = Math.random();
  
  if (random < 0.3) {
    return {
      status: 'approved',
      prediction: "Your PR will be approved! The code gods smile upon you.",
      confidence: Math.floor(random * 100),
    };
  } else if (random < 0.6) {
    return {
      status: 'changes-requested',
      prediction: "Changes will be requested. But they'll make your code better!",
      confidence: Math.floor(random * 100),
    };
  } else if (random < 0.9) {
    return {
      status: 'commented',
      prediction: "Thoughtful comments await. Your reviewers are engaged!",
      confidence: Math.floor(random * 100),
    };
  } else {
    return {
      status: 'chaos',
      prediction: "The CI/CD pipeline has its own plans. Prepare for adventure!",
      confidence: 42, // The answer to everything
    };
  }
}

/**
 * Generate a random commit message
 * (For when you've run out of creativity)
 */
export function generateCommitMessage(): string {
  const prefixes = [
    "feat", "fix", "docs", "style", "refactor", 
    "perf", "test", "chore", "wip", "yolo"
  ];
  
  const actions = [
    "implement", "fix", "update", "remove", "add",
    "refactor", "optimize", "improve", "enhance", "patch"
  ];
  
  const subjects = [
    "the thing", "stuff", "that bug", "everything",
    "user authentication", "API endpoints", "database queries",
    "UI components", "error handling", "type definitions",
    "configuration", "dependencies", "tests", "documentation",
    "performance issues", "memory leaks", "race conditions",
    "the chaos", "technical debt", "spaghetti code"
  ];
  
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  const action = actions[Math.floor(Math.random() * actions.length)];
  const subject = subjects[Math.floor(Math.random() * subjects.length)];
  
  // 10% chance of a chaotic commit message
  if (Math.random() < 0.1) {
    const chaotic = [
      "YOLO: pushing to production",
      "Fixed ALL the things (I think)",
      "This definitely works (tested in prod)",
      "If this breaks, rollback immediately",
      "I have no idea what I'm doing",
      "Past me was an idiot, fixed their code",
      "Removed console.log (hopefully all of them)",
      "It works on my machine ¯\\_(ツ)_/¯",
      "Temporary fix that will definitely not be permanent",
      "Attempted to fix bug, may have created 3 more",
    ];
    return chaotic[Math.floor(Math.random() * chaotic.length)];
  }
  
  return `${prefix}: ${action} ${subject}`;
}

/**
 * Predict how long a bug will take to fix
 */
export function predictBugFixTime(bugDescription: string): {
  estimate: string;
  reality: string;
  confidence: string;
} {
  const estimates = [
    "5 minutes",
    "30 minutes", 
    "1 hour",
    "2 hours",
    "half a day",
    "1 day",
  ];
  
  const realities = [
    "3 days and a mental breakdown",
    "2 weeks and you'll question everything",
    "Still not fixed (it's a feature now)",
    "Fixed in 30 seconds (it was a typo)",
    "5 hours because you were looking at the wrong file",
    "Overnight because you dreamed the solution",
  ];
  
  return {
    estimate: estimates[Math.floor(Math.random() * estimates.length)],
    reality: realities[Math.floor(Math.random() * realities.length)],
    confidence: "Very low (it's always more complicated)",
  };
}
