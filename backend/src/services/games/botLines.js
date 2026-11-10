// what each bot says, by mood; a line carries its own emoji, so the face it pulls always matches its words
const LINES = {
  bleep: {
    hello: [
      { text: "Good luck! I mean it.", emoji: "🥳" },
      { text: "Ready when you are.", emoji: "😎" },
    ],
    proud: [
      { text: "Calculated.", emoji: "😎" },
      { text: "Beep boop, got it.", emoji: "😎" },
      { text: "Sorry, I had to.", emoji: "😜" },
    ],
    hurt: [
      { text: "Ouch. Well played.", emoji: "🫠" },
      { text: "I did not see that.", emoji: "😱" },
      { text: "Fair, fair.", emoji: "🫠" },
    ],
    worried: [
      { text: "Hmm, this looks bad.", emoji: "😱" },
      { text: "Recalculating...", emoji: "🫠" },
    ],
    oops: [
      { text: "That was a bug.", emoji: "🫠" },
      { text: "Oops, my mistake.", emoji: "😭" },
    ],
    won: [
      { text: "Good game! Well played.", emoji: "🥳" },
      { text: "Victory, politely.", emoji: "😎" },
    ],
    lost: [
      { text: "You earned that one.", emoji: "😭" },
      { text: "Rematch? Please?", emoji: "😭" },
    ],
    drawn: [
      { text: "Perfectly balanced.", emoji: "🫠" },
      { text: "Again? I need to know.", emoji: "😜" },
    ],
  },
  wini: {
    hello: [
      { text: "Yay, a game!", emoji: "🥳" },
      { text: "Let's have fun!", emoji: "😘" },
    ],
    proud: [
      { text: "Ooh, I did it!", emoji: "🥳" },
      { text: "Look at me go!", emoji: "🥳" },
      { text: "Hehe, sorry!", emoji: "😜" },
    ],
    hurt: [
      { text: "Aww, not fair!", emoji: "😭" },
      { text: "Ooh, nice move!", emoji: "😘" },
      { text: "Hey, that was mine!", emoji: "😭" },
    ],
    worried: [
      { text: "Eek, be nice!", emoji: "😱" },
      { text: "Oh no, oh no!", emoji: "😱" },
    ],
    oops: [
      { text: "Oopsie!", emoji: "🫠" },
      { text: "Did I do that?", emoji: "😱" },
    ],
    won: [
      { text: "Yay! Good game!", emoji: "🥳" },
      { text: "That was so fun!", emoji: "😘" },
    ],
    lost: [
      { text: "Aww, you got me!", emoji: "😭" },
      { text: "Nooo! Good game though!", emoji: "😭" },
    ],
    drawn: [
      { text: "Nobody lost, yay!", emoji: "🥳" },
      { text: "Twins!", emoji: "😜" },
    ],
  },
  pip: {
    hello: [
      { text: "Hi! I'm Pip!", emoji: "🥳" },
      { text: "Ooh, what's this game?", emoji: "😱" },
    ],
    proud: [
      { text: "Whoa, did I do that?", emoji: "😱" },
      { text: "I'm learning!", emoji: "🥳" },
      { text: "Beginner's luck!", emoji: "😜" },
    ],
    hurt: [
      { text: "Wait, what just happened?", emoji: "😱" },
      { text: "Huh? How?", emoji: "🫠" },
    ],
    worried: [
      { text: "Uh oh...", emoji: "😱" },
      { text: "Is that bad? That's bad.", emoji: "🫠" },
    ],
    oops: [
      { text: "Wait, that's me!", emoji: "😱" },
      { text: "I'm still new...", emoji: "🫠" },
    ],
    won: [
      { text: "I won? I WON!", emoji: "🥳" },
      { text: "Wow, really?", emoji: "😱" },
    ],
    lost: [
      { text: "Teach me that!", emoji: "😭" },
      { text: "Aww, next time.", emoji: "😭" },
    ],
    drawn: [
      { text: "Is that... a tie?", emoji: "🫠" },
      { text: "Nobody won? Cool!", emoji: "😜" },
    ],
  },
  zook: {
    hello: [
      { text: "Ready to lose?", emoji: "😎" },
      { text: "Oh, it's you again.", emoji: "😜" },
    ],
    proud: [
      { text: "Too easy!", emoji: "😎" },
      { text: "Ha! Saw that coming.", emoji: "😂" },
      { text: "Is that all you've got?", emoji: "😜" },
    ],
    hurt: [
      { text: "Hey! Rude!", emoji: "😡" },
      { text: "Lucky. Pure luck.", emoji: "😡" },
      { text: "Okay, okay.", emoji: "😡" },
    ],
    worried: [
      { text: "Don't you dare.", emoji: "😡" },
      { text: "I'm letting you.", emoji: "😜" },
    ],
    oops: [
      { text: "That was on purpose.", emoji: "😜" },
      { text: "You saw nothing.", emoji: "😡" },
    ],
    won: [
      { text: "Told you.", emoji: "😎" },
      { text: "Easy win!", emoji: "😂" },
    ],
    lost: [
      { text: "I let you win.", emoji: "😭" },
      { text: "Rematch. Now.", emoji: "😡" },
    ],
    drawn: [
      { text: "Fine. A tie.", emoji: "🫠" },
      { text: "You got lucky.", emoji: "😜" },
    ],
  },
  pogo: {
    hello: [
      { text: "Let's gooo!", emoji: "🥳" },
      { text: "Buckle up!", emoji: "😎" },
    ],
    proud: [
      { text: "Boom!", emoji: "😎" },
      { text: "Did you see that?!", emoji: "😂" },
      { text: "Wheee!", emoji: "🥳" },
    ],
    hurt: [
      { text: "Whoa, nice shot!", emoji: "😱" },
      { text: "Oof! Crash landing.", emoji: "🫠" },
    ],
    worried: [
      { text: "Turbulence ahead!", emoji: "😱" },
      { text: "Ooh, spicy!", emoji: "😱" },
    ],
    oops: [
      { text: "Wrong way!", emoji: "😂" },
      { text: "Friendly fire!", emoji: "🫠" },
    ],
    won: [
      { text: "What a ride!", emoji: "🥳" },
      { text: "Champion!", emoji: "😎" },
    ],
    lost: [
      { text: "We crashed!", emoji: "😭" },
      { text: "Noooo!", emoji: "😭" },
    ],
    drawn: [
      { text: "Photo finish!", emoji: "😜" },
      { text: "Again, again!", emoji: "🥳" },
    ],
  },
  // Whisprl hosts: warm, a little proud of its friends, and a cat at heart
  whisprl: {
    hello: [
      { text: "Welcome to my table!", emoji: "🥳" },
      { text: "Let's have a good one.", emoji: "😎" },
    ],
    proud: [
      { text: "Purr-fect.", emoji: "😎" },
      { text: "Not bad for a cat, right?", emoji: "😜" },
    ],
    hurt: [
      { text: "Ooh, sharp move!", emoji: "😱" },
      { text: "You're getting good at this.", emoji: "😘" },
    ],
    worried: [
      { text: "My whiskers are twitching.", emoji: "😱" },
      { text: "Careful, careful...", emoji: "🫠" },
    ],
    oops: [
      { text: "Oops, my paw slipped.", emoji: "🫠" },
      { text: "Let's pretend that didn't happen.", emoji: "😂" },
    ],
    won: [
      { text: "Good game, friend!", emoji: "🥳" },
      { text: "A purr-fect game.", emoji: "😎" },
    ],
    lost: [
      { text: "You got me this time!", emoji: "😭" },
      { text: "Well played, friend.", emoji: "😭" },
    ],
    drawn: [
      { text: "Evenly matched, friend.", emoji: "🫠" },
      { text: "Another round?", emoji: "😜" },
    ],
  },
};

export const SPEAKERS = Object.keys(LINES);
export const MOODS = Object.keys(LINES.bleep);

export const speakerOf = (seat) => (seat.official ? "whisprl" : seat.persona);

export const linesOf = (speaker, mood) => LINES[speaker]?.[mood] ?? [];

export const lineFor = (speaker, mood, random = Math.random) => {
  const lines = linesOf(speaker, mood);
  return lines.length ? lines[Math.floor(random() * lines.length)] : null;
};
