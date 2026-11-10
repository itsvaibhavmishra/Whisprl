import { CONTACT_EMAIL } from "@/config";
import { PATH_DOCS } from "@/routes/paths";

export const LAST_UPDATED = "11 November 2026";

export const INTRO = ["You can delete your Whisprl account at any time, from the website or the Android app. Nothing needs installing, and it takes a minute."];

export const SECTIONS = [
  {
    id: "how",
    title: "How to delete your account",
    blocks: [
      {
        ordered: true,
        list: [
          "Log in at whisprl.netlify.app, or open the Whisprl app.",
          "Open Settings, then Account, then Delete account.",
          "Choose why you are leaving, then enter the code sent to your email address.",
        ],
      },
      {
        parts: ["Can no longer log in? Email ", { email: CONTACT_EMAIL }, " from the address on the account, and it will be deleted for you."],
      },
    ],
  },
  {
    id: "what-happens",
    title: "What happens next",
    blocks: [
      "You are logged out everywhere, and the account is hidden straight away: friends see “Whisprl user” in your place, and nobody can find you. The account is deleted 14 days later.",
      "Changed your mind? Logging in before the 14 days are up brings everything back and cancels the deletion.",
    ],
  },
  {
    id: "deleted",
    title: "What is deleted",
    blocks: [
      {
        list: [
          "your email address and password, so nobody can log in to the account again",
          "your name, username, profile picture, cover, status line and birthday",
          "your statuses, with their photos and videos",
          "your passkeys, and every device you were logged in on",
          "your friends, friend requests, blocked people and settings",
          "your game requests",
          "your place in every group. A group you owned is handed on to another member",
        ],
      },
    ],
  },
  {
    id: "kept",
    title: "What is kept",
    blocks: [
      {
        list: [
          "the chats the people you talked to have with you, including what you sent them, still end-to-end encrypted. They need them, and the public half of your encryption keys, to keep reading their own conversations. You show in them as “Whisprl user”",
          "the reason you gave for leaving, and any note, with no name or email address attached",
          "the days the account opened Whisprl, counted only in totals of active people",
          "messages attached to a report, until 90 days after the report is closed",
          "records of any action staff took on the account, such as a suspension",
        ],
      },
      {
        parts: ["The ", { label: "privacy policy", to: PATH_DOCS.general.privacy }, " covers everything else about what Whisprl stores."],
      },
    ],
  },
  {
    id: "some-data",
    title: "Delete some of your data and keep your account",
    blocks: [
      "You can delete these yourself at any time, and each is removed from Whisprl's servers straight away:",
      {
        list: [
          "a message you sent: press and hold it, then choose Delete for everyone. Its words and any photo, video or file go, and the chat shows that a message was deleted. Delete for me only hides it on your devices",
          "a status: open it, then choose Delete update from its menu. Its photo or video goes with it, and every status is deleted after 24 hours anyway",
          "your profile photo or cover photo: open your profile, edit it, and remove the photo",
        ],
      },
    ],
  },
];
