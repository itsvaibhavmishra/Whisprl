import { CONTACT_EMAIL, PORTFOLIO_URL, SOURCE_URL } from "@/config";
import { PATH_DOCS } from "@/routes/paths";

export const LAST_UPDATED = "19 October 2026";

export const INTRO = [
  "These terms cover your use of Whisprl, a free real-time chat app run by ",
  { label: "Vaibhaw Mishra", href: PORTFOLIO_URL },
  " at whisprl.netlify.app and on Android. By creating an account or using Whisprl, you agree to them. If you do not agree, please do not use Whisprl.",
];

export const SECTIONS = [
  {
    id: "your-account",
    title: "Your account",
    blocks: [
      "You need an account to chat. You can sign up with your email address, which is confirmed with a one-time code, or with a Google, GitHub or LinkedIn account. The Android app offers Google and email.",
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
          "share anything that sexually exploits or endangers a child",
          "send anything else that is illegal",
          "send spam, scams or unwanted bulk messages",
          "share malware, or links meant to harm someone",
          "pretend to be someone else",
          "try to get into other accounts, get around reCAPTCHA or rate limits, or overload the service",
        ],
      },
      {
        parts: [
          "The ",
          { label: "child safety standards", to: PATH_DOCS.general.childSafety },
          " set out how Whisprl handles anything that harms a child. Accounts that break these rules may be suspended or removed.",
        ],
      },
    ],
  },
  {
    id: "your-messages",
    title: "Your messages and files",
    blocks: [
      "What you send stays yours. By sending it, you let Whisprl store it and deliver it to the people in that conversation, and that is all it is used for.",
      "You are responsible for what you send, and for having the right to share it.",
      "Messages, photos, videos, voice messages, documents, reactions and statuses shared with friends are end-to-end encrypted: they are locked on your device before they leave it, and only the people they are for can open them. Whisprl's servers store them so they are there when you come back, but cannot read them.",
      "A status is deleted after 24 hours, along with its photo or video.",
    ],
  },
  {
    id: "privacy",
    title: "Your privacy",
    blocks: [
      {
        parts: [
          "The ",
          { label: "privacy policy", to: PATH_DOCS.general.privacy },
          " explains what Whisprl stores, why, who else handles it and how long it is kept. Your data is not sold, and Whisprl shows no ads.",
        ],
      },
    ],
  },
  {
    id: "leaving",
    title: "Leaving Whisprl",
    blocks: [
      {
        parts: [
          "You can stop using Whisprl at any time, and delete your account from Settings, then Account, then Delete account. It is hidden straight away and deleted 14 days later. ",
          { label: "Deleting your account", to: PATH_DOCS.general.deleteAccount },
          " explains what is removed and what stays.",
        ],
      },
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
    blocks: ["When these terms change, the date at the top changes with them. Using Whisprl after that means you accept the new version."],
  },
  {
    id: "contact",
    title: "Contact",
    blocks: [
      {
        parts: ["Questions about these terms? Email Whisprl at ", { email: CONTACT_EMAIL }, "."],
      },
    ],
  },
];
