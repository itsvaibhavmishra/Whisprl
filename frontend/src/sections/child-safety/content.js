import { CONTACT_EMAIL } from "@/config";
import { PATH_DOCS } from "@/routes/paths";

export const LAST_UPDATED = "19 October 2026";

export const INTRO = [
  "Whisprl does not allow child sexual abuse and exploitation (CSAE) of any kind. These standards apply to everyone who uses Whisprl, on the website and in the Android app.",
];

export const SECTIONS = [
  {
    id: "not-allowed",
    title: "What is not allowed",
    blocks: [
      {
        list: [
          "child sexual abuse material (CSAM), whether real, drawn or made by AI",
          "grooming, or seeking any sexual contact with someone under 18",
          "sexualising a child in words, pictures or video",
          "sextortion, or threatening to share intimate images of a child",
          "trafficking, or arranging to meet a child for sexual purposes",
        ],
      },
    ],
  },
  {
    id: "age",
    title: "Who can use Whisprl",
    blocks: ["Whisprl is for people aged 13 and over. Sign-up asks for a birthday, and anyone under 13 cannot create an account."],
  },
  {
    id: "reporting",
    title: "How to report it",
    blocks: [
      "In Whisprl, report a person, a chat, a group or a status from its menu. Reports go straight to Whisprl's staff.",
      "Messages are end-to-end encrypted, so Whisprl cannot see them on its own. When you report a chat, your own device sends the reported message and the ones around it with the report, so staff can see exactly what happened.",
      {
        parts: ["You can also email ", { email: CONTACT_EMAIL }, ". If a child is in immediate danger, contact your local emergency services first."],
      },
    ],
  },
  {
    id: "what-whisprl-does",
    title: "What Whisprl does",
    blocks: [
      "Every report is reviewed. An account found sharing CSAM or exploiting a child is banned at once: it is signed out everywhere, can no longer send anything, and its profile is hidden from everyone.",
      "Confirmed child sexual abuse material is reported to the National Center for Missing & Exploited Children (NCMEC), or to the authority responsible where the person is, and Whisprl cooperates with law enforcement as the law requires.",
      "Whisprl complies with the child safety laws that apply to it.",
    ],
  },
  {
    id: "contact",
    title: "Child safety contact",
    blocks: [
      {
        parts: [
          "Whisprl's contact for child safety can be reached at ",
          { email: CONTACT_EMAIL },
          ". The ",
          { label: "terms", to: PATH_DOCS.general.tnc },
          " and ",
          { label: "privacy policy", to: PATH_DOCS.general.privacy },
          " cover the rest of how Whisprl works.",
        ],
      },
    ],
  },
];
