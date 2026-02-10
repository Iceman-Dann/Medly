// Judge Character Memory System
interface UserMemory {
  email: string;
  visitCount: number;
  lastVisit: string;
  judgeMood: 'friendly' | 'sassy' | 'impressed' | 'suspicious' | 'proud';
  funnyMoments: string[];
  passwordAttempts: number;
  loginSuccess: boolean;
  achievements: string[];
}

class JudgeCharacter {
  private memories: Map<string, UserMemory> = new Map();
  private currentMood: 'friendly' | 'sassy' | 'impressed' | 'suspicious' | 'proud' = 'friendly';
  private mousePosition = { x: 0, y: 0 };

  constructor() {
    this.loadMemories();
  }

  private loadMemories() {
    const stored = localStorage.getItem('judge_memories');
    if (stored) {
      try {
        const data = JSON.parse(stored);
        // Handle different data formats
        if (Array.isArray(data)) {
          this.memories = new Map(data);
        } else if (typeof data === 'object') {
          this.memories = new Map(Object.entries(data));
        }
      } catch (error) {
        console.warn('Failed to load judge memories, starting fresh:', error);
        this.memories = new Map();
      }
    }
  }

  private saveMemories() {
    const data = Array.from(this.memories.entries());
    localStorage.setItem('judge_memories', JSON.stringify(data));
  }

  getMemory(email: string): UserMemory {
    if (!this.memories.has(email)) {
      this.memories.set(email, {
        email,
        visitCount: 0,
        lastVisit: new Date().toISOString(),
        judgeMood: 'friendly',
        funnyMoments: [],
        passwordAttempts: 0,
        loginSuccess: false,
        achievements: []
      });
    }
    return this.memories.get(email)!;
  }

  updateMemory(email: string, updates: Partial<UserMemory>) {
    const memory = this.getMemory(email);
    Object.assign(memory, updates, {
      lastVisit: new Date().toISOString(),
      visitCount: memory.visitCount + 1
    });
    this.saveMemories();
    this.updateMood(memory);
  }

  private updateMood(memory: UserMemory) {
    if (memory.visitCount > 5 && memory.loginSuccess) {
      this.currentMood = 'proud';
    } else if (memory.passwordAttempts > 3) {
      this.currentMood = 'suspicious';
    } else if (memory.funnyMoments.length > 2) {
      this.currentMood = 'impressed';
    } else if (memory.visitCount > 2) {
      this.currentMood = 'sassy';
    } else {
      this.currentMood = 'friendly';
    }
  }

  getJudgeMessage(email: string, context: 'greeting' | 'password' | 'success' | 'error' | 'google'): string {
    const memory = this.getMemory(email);
    const mood = memory.judgeMood;

    const messages = {
      greeting: {
        friendly: [
          "Well hello there! Ready to judge your login skills? I've seen it all! 😊",
          "Ah, a new victim! I mean... visitor! Welcome to the courtroom! 👋⚖️",
          "Let's see if you can impress me today! My standards are ridiculously high! 🤔",
          "Another one! Fresh meat for the authentication grinder! Mwahaha! 😈",
          "Greetings! I'm your personal login bouncer! Try not to embarrass yourself! 🕵️‍♂️"
        ],
        sassy: [
          `Back again? This is your ${memory.visitCount}th visit! Don't you have a life? 😉`,
          "Oh great, it's you again. Let's make this quick, I have memes to scroll! 😏📱",
          "Still haven't learned your password? At this point, I'm concerned! 🤦‍♀️",
          `${memory.visitCount} times! Are you addicted to my judging or just forgetful? 🤔`,
          "You again! I was just thinking about how much I missed judging your poor choices! 😅"
        ],
        impressed: [
          "Look who's back! You're becoming a regular! Should I start charging rent? 🌟💰",
          `${memory.funnyMoments.length} funny moments! You're more entertaining than cat videos! 😄🐱`,
          "I remember you! You're the one with the surprisingly good taste! Have a cookie! 🎭🍪",
          `Wow, ${memory.visitCount} visits! You're basically family now! Pass the gravy! 🦃`,
          "You're like a fine wine - getting better with each visit! Or maybe I'm just drunk! 🍷😄"
        ],
        suspicious: [
          `${memory.passwordAttempts} failed attempts... Should I call the cyber police? 🕵️‍♂️🚔`,
          "Hmm, someone's persistent... or just really bad at passwords! I'm investigating! 🔍",
          "I'm watching you... closely! Very closely! 👁️👁️ Don't make any sudden moves!",
          "At this point, I think you might be a robot trying to crack my system! Beep boop! 🤖",
          `${memory.passwordAttempts} times! Are you testing my patience or just really committed to failure? 🎭`
        ],
        proud: [
          `${memory.visitCount} visits! You're practically the CEO of this login page! 🏠👔`,
          "Look at you, all successful and stuff! I'm so proud I might cry! 😊🎭",
          "You've graduated from login newbie to authentication master! I'll write you a recommendation! 🎓✨",
          "If I had arms, I'd give you a standing ovation! Or at least a slow clap! 👏🎉",
          `${memory.visitCount} times! You're the Michael Jordan of logging in! GOAT status! 🐐🏆`
        ]
      },
      password: {
        friendly: [
          "Ooh, let's see what you've got! Type it... if you dare! I'm watching! 😏",
          "Is that your final answer? Think carefully! My judgment is swift and brutal! 🤔",
          "Don't worry, I won't laugh... much! Okay, maybe a lot! 😄🤣",
          "Enter your secret code! I promise not to share it with everyone! Maybe! 🤫",
          "Type away! I've seen worse... probably! Actually, no, this might be the worst! 😅"
        ],
        sassy: [
          "Really? That's your password? My grandma uses stronger passwords for her recipe blog! 🐕📝",
          "Are you even trying? Put some effort into it! This is embarrassing! 💪😤",
          "I've seen better passwords on a post-it note stuck to a monitor! 📝🙄",
          "Did you get this password from a 'worst passwords ever' list? Because it's working! 😅",
          "This password is so weak, it couldn't even get into a kindergarten! 🏫😂"
        ],
        impressed: [
          "Not bad! Not bad at all! You're learning! There's hope for you yet! 🌟✨",
          "Hey, that's actually decent! I'm impressed! A rare occurrence indeed! 👏",
          "Finally! A password that doesn't make me cringe! I might frame this! 😌🖼️",
          "Wow! A good password! Pinch me, I must be dreaming! 🤯✨",
          "This password has actual strength! I'm nominating you for an award! 🏆🎉"
        ],
        suspicious: [
          "Wait, didn't you try this already? Deja vu! Are you in a time loop? 🔄⏰",
          "Third time's the charm... or is it the 10th? I've lost count! 🕵️‍♀️📊",
          "This password looks familiar... suspiciously familiar! 🤔🔍",
          "Are you testing different variations of the same bad password? Creative! 😅",
          "I feel like we've been here before... Groundhog Day vibes! 🐿️📅"
        ],
        proud: [
          "Now that's what I call a password! A+! Gold star! 🌟⭐",
          "Beautiful! Absolutely beautiful! You've made me so proud! *wipes tear* 🎓😭",
          "Perfection! I'd use this password myself! But I won't! Because I'm a judge! ⚖️😎",
          "This password is so good, it should be in the Password Hall of Fame! 🏛️🏆",
          "If passwords were people, this one would be president! 🏛️✨"
        ]
      },
      success: {
        friendly: [
          "You did it! Welcome in! Let the party begin! 🎉🎊",
          "Success! You're officially logged in! Confetti time! 🌟🎊",
          "Yay! You made it! Let the fun begin! *blows party horn* 🎉🎈",
          "Victory! You've conquered the login! Your reward is... more login forms! 😄🎮",
          "You're in! Welcome to the cool kids club! We have cookies! 🍪✨"
        ],
        sassy: [
          "Took you long enough! But you're in! Don't get cocky! 😏🙄",
          "Finally! I was about to fall asleep! That was painful to watch! 😴💤",
          "About time! Welcome, I guess! Try not to break anything! 🙄😤",
          "You made it! After all that struggle! Must have been exhausting! 💪😅",
          "Well look who finally figured it out! What's next, tying your shoes? 👟😏"
        ],
        impressed: [
          "Flawless! Absolutely flawless! I'm speechless! (Almost!) 🌟🤯",
          "Now THAT'S how you log in! Bravo! Encore! Encore! 👏🎭",
          "Perfection! You're a login master! I bow to your skills! 🙇‍♂️✨",
          "Incredible! That was poetry in motion! I'm writing a song about it! 🎤🎵",
          "Masterful! Absolutely masterful! You should teach classes! 🎓👨‍🏫"
        ],
        suspicious: [
          "Oh... you actually made it! I'm shocked! Suspiciously shocked! 😮🤔",
          "Well I'll be damned! You did it! Are you sure you didn't cheat? 🤯🕵️‍♂️",
          "Okay, okay, you proved me wrong! Welcome! But I'm watching you! 👀🔍",
          "You succeeded! I'm not sure how, but you did! Don't get comfortable! 😏⚖️",
          "Against all odds, you made it! The universe works in mysterious ways! 🌌🤔"
        ],
        proud: [
          "YES! That's my favorite user! I knew you could do it! Group hug! 🏆🤗",
          "Absolutely perfect! I knew you had it in you! So proud right now! 🌟😭",
          "You make me so proud! Welcome back! Let me get my camera! 📸🎉",
          "That's my user! The one I brag about to all the other judges! 🏆✨",
          "PERFECTION! You're the reason I became a judge! True story! ⚖️❤️"
        ]
      },
      error: {
        friendly: [
          "Oops! That's not it! Try again! You got this! I believe in you! 😊💪",
          "Nope! But don't give up! Success is just around the corner! 🤔🗺️",
          "Almost! Try a different approach! Maybe think happy thoughts! 🌈✨",
          "Not quite! But hey, Rome wasn't built in a day! Neither are good passwords! 🏗️😄",
          "Close but no cigar! Try again! The cigar is waiting! 🚬😅"
        ],
        sassy: [
          "WRONG! Did you forget your own password? That's impressive! 🤦‍♀️🤡",
          "Nope! Are you even trying? This is getting embarrassing! 🙄😳",
          "That's not it! Try harder! This is painful to watch! 😅🤦‍♂️",
          "Wrong again! At this point, I think you're doing this on purpose! 😏🎭",
          "Still wrong! Did you forget how keyboards work? Let me know! 📝😂"
        ],
        impressed: [
          "Close! So close! You're almost there! The suspense is killing me! 🎯😰",
          "Not quite! But I can see the gears turning! It's beautiful! 🤔⚙️",
          "Almost! Don't give up now! You're on the verge of greatness! ✨🏔️",
          "So close! I can taste the success! It tastes like chicken! 🍗😄",
          "Nearly there! The anticipation is real! I'm on the edge of my seat! 💺🎬"
        ],
        suspicious: [
          "And the failures continue! I'm starting a tally board! 🕵️‍♂️📊",
          "Still wrong! Should I just ban you? For my own sanity? 😏🚫",
          "Nope! At this rate, you'll never get in! Should I call for backup? 🚔🚓",
          "Wrong again! I'm documenting this for scientific study! 🔬📚",
          "Still not it! I'm running out of witty comments! Just get it right! 😤😂"
        ],
        proud: [
          "Even the best have off days! Try again! Champion! 🌟🏆",
          "Not this time! But I believe in you! Always have! Always will! 💪❤️",
          "Everyone makes mistakes! Even you! Try again, my friend! 😊🤝",
          "Temporary setback! The comeback story will be epic! I can feel it! 🎬✨",
          "Minor hiccup! You'll get it! You always do! That's why you're my favorite! 🌟😊"
        ]
      },
      google: {
        friendly: [
          "Ooh, fancy! Using Google to do the hard work! Smart and lazy! I approve! 😎⚡",
          "Google to the rescue! Smart move! Let the robots handle it! 🤖✨",
          "Let Google handle it! You're efficiently outsourcing your memory! 🧠💼",
          "Ooh la la! Google sign-in! So sophisticated! What will you think of next! 🎩✨",
          "Google power! You're like a tech wizard! Or just lazy! Either way, welcome! 🧙‍♂️😄"
        ],
        sassy: [
          "Too lazy to type a password? I see how it is! Let Google do all the work! 😏🙄",
          "Letting Google do all the work? Classic! What's next, letting them breathe for you? 😅",
          "Google sign-in? How original! Did you get that from a 2010 tutorial? 📱😂",
          "Too important to remember passwords? I get it! You're basically royalty! 👑😏",
          "Google saves the day! And your brain from having to remember things! 🧠💾"
        ],
        impressed: [
          "Smart! Using the best of both worlds! I'm genuinely impressed! 🌟🤯",
          "Google integration! Very sophisticated! You're clearly a professional! 🎩✨",
          "I like your style! Efficient and smart! You're the chosen one! 👏🌟",
          "Excellent choice! Modern, secure, and you didn't have to think! Perfect! 🎯✨",
          "Google authentication! You're operating on another level! I'm not worthy! 🙇‍♂️🏆"
        ],
        suspicious: [
          "What's Google hiding? Are you a spy? Or just really bad at secrets? 🕵️‍♂️🤔",
          "Letting Google in our business? Hmm... What are you planning? 🤔🔍",
          "Google knows everything... including your search history! I've seen things! 😱👀",
          "Google sign-in? Are you sure you want them knowing you visit this page? 🤫😏",
          "What's with the secrecy? Using Google to hide something? I'm watching! 👁️🕵️‍♀️"
        ],
        proud: [
          "Excellent choice! Security and convenience! You're a genius! 🏆🧠",
          "Perfect! Using modern tech the right way! I'm so proud! 🌟😭",
          "Google integration! You're living in the future! I'm from the past! ⏰😄",
          "Smart move! You're making all the right choices! I knew you were special! ✨🌟",
          "Google power! You're like a tech superhero! What's your power? Remembering passwords! 🦸‍♂️⚡"
        ]
      }
    };

    const contextMessages = messages[context][mood];
    return contextMessages[Math.floor(Math.random() * contextMessages.length)];
  }

  addFunnyMoment(email: string, moment: string) {
    const memory = this.getMemory(email);
    memory.funnyMoments.push(moment);
    if (memory.funnyMoments.length > 10) {
      memory.funnyMoments.shift(); // Keep only last 10 moments
    }
    this.updateMemory(email, { funnyMoments: memory.funnyMoments });
  }

  updateMousePosition(x: number, y: number) {
    this.mousePosition = { x, y };
  }

  getMousePosition() {
    return this.mousePosition;
  }

  getAchievements(email: string): string[] {
    const memory = this.getMemory(email);
    const achievements: string[] = [];

    if (memory.visitCount === 1) achievements.push("First Visit! 🎉");
    if (memory.visitCount === 5) achievements.push("Regular Visitor! 🌟");
    if (memory.visitCount === 10) achievements.push("Dedicated User! 🏆");
    if (memory.passwordAttempts === 0 && memory.loginSuccess) achievements.push("Perfect Login! 🎯");
    if (memory.funnyMoments.length >= 5) achievements.push("Class Clown! 🤡");
    if (memory.judgeMood === 'proud') achievements.push("Judge's Favorite! 👑");

    return achievements;
  }
}

export const judgeCharacter = new JudgeCharacter();
export type { UserMemory };
