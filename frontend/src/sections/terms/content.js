import { PORTFOLIO_URL, SOURCE_URL } from "@/config";

export const LAST_UPDATED = "7 October 2026";

const CONTACT = { label: "vaibhaw.vercel.app", href: PORTFOLIO_URL };

export const INTRO = {
  parts: [
    "These terms cover your use of Whisprl, a free real-time chat app run by ",
    { label: "Vaibhaw Mishra", href: CONTACT.href },
    " at whisprl.netlify.app. By creating an account or using Whisprl, you agree to them. If you do not agree, please do not use Whisprl.",
  ],
};

export const SECTIONS = [
  {
    id: "your-account",
    title: "Your account",
    blocks: [
      "You need an account to chat. You can sign up with your email address, which is confirmed with a one-time code, or with a Google, GitHub or LinkedIn account.",
      "You must be at least 13 years old to use Whisprl.",
      "Use your real name and an email address you control. Disposable email addresses are not accepted.",
      "Keep your login details to yourself. You are responsible for what happens under your account, so get in touch straight away if you think someone else has got into it.",
    ],
  },
  {
    id: "fair-use",
    title: "Using Whisprl fairly",
    blocks: [
      "When you use Whisprl, you agree not to:",
      {
        list: [
          "harass, threaten or bully anyone, or send hateful content",
          "send anything illegal, including any content that exploits children",
          "send spam, scams or unwanted bulk messages",
          "share malware, or links meant to harm someone",
          "pretend to be someone else",
          "try to get into other accounts, get around reCAPTCHA or rate limits, or overload the service",
        ],
      },
      "Accounts that break these rules may be suspended or removed.",
    ],
  },
  {
    id: "your-messages",
    title: "Your messages and files",
    blocks: [
      "What you send stays yours. By sending it, you let Whisprl store it and deliver it to the people in that conversation, and that is all it is used for.",
      "You are responsible for what you send, and for having the right to share it.",
      "Messages, photos and documents are end-to-end encrypted: they are locked in your browser before they leave it, and only the people in the conversation can open them. Whisprl's servers store them so they are there when you come back, but cannot read them. Messages sent before encryption arrived are stored as they were sent.",
    ],
  },
  {
    id: "your-data",
    title: "What is stored, and why",
    blocks: [
      "Whisprl keeps only what it needs to work:",
      {
        list: [
          "your name, email address, profile picture and status, so friends can find and recognise you",
          "your password and one-time codes, stored only as one-way hashes, so nobody can read your password, including the people who run Whisprl",
          "your friends list and conversations, and your messages and files, encrypted so only the people in each conversation can open them",
          "whether you are online, so your friends can see it",
          "which sign-in methods you have connected, and the public half of any passkey you add and of the key each browser you log in on keeps, which can only check a sign-in, never make one",
        ],
      },
      "Whisprl relies on these services to run:",
      {
        list: [
          "Google, GitHub and LinkedIn, if you sign in with them. Whisprl receives your name, email address and profile picture from them.",
          "Google reCAPTCHA, to keep bots out of sign-up and log-in",
          "Google Analytics, to count visits and see which pages are used",
          "Cloudinary, to store the photos and documents you send, which it receives encrypted",
          "Gmail, to send your verification codes and password reset emails",
          "Netlify and Render, which host the app",
        ],
      },
      "Whisprl sets no cookies of its own. It keeps the key that keeps you logged in, your encryption key and preferences such as dark mode in your browser's storage. Google Analytics and reCAPTCHA set cookies of their own. Your data is not sold, and Whisprl shows no ads.",
    ],
  },
  {
    id: "leaving",
    title: "Leaving Whisprl",
    blocks: [
      "You can stop using Whisprl at any time. There is no button to delete an account yet, so to have your account and messages removed, get in touch and they will be deleted.",
      "Accounts that break these terms may be suspended or closed.",
    ],
  },
  {
    id: "the-service",
    title: "The service itself",
    blocks: [
      "Whisprl is free and provided as it is. It is kept running as well as possible, but there is no promise that it will always be available, free of errors, or that messages will never be lost.",
      "Features may change, and Whisprl may stop running altogether. If it does, there will be notice beforehand wherever possible.",
      "As far as the law allows, Whisprl is not liable for indirect losses, or for what other people send you.",
    ],
  },
  {
    id: "open-source",
    title: "Open source",
    blocks: [
      {
        parts: [
          "Whisprl's code is public ",
          { label: "on GitHub", href: SOURCE_URL },
          " under the CC0 licence. That licence covers the code only. It does not cover the messages, files or profile details people share on Whisprl.",
        ],
      },
    ],
  },
  {
    id: "changes",
    title: "Changes to these terms",
    blocks: [
      "When these terms change, the date at the top changes with them. Using Whisprl after that means you accept the new version.",
    ],
  },
  {
    id: "contact",
    title: "Contact",
    blocks: [
      {
        parts: [
          "Questions about these terms, or a request about your data? Reach Vaibhaw Mishra through ",
          CONTACT,
          ".",
        ],
      },
    ],
  },
];
