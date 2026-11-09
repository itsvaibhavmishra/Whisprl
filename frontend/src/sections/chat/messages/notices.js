import { PATH_DOCS } from "@/routes/paths";
import { contactPathOf } from "@/sections/contacts/contactsRoute";
import { reportSubjectOf } from "@/utils/messageSummary";

// names are typed by people, so any markup in them is dropped rather than followed
const plain = (name) => name.replace(/[*[\]()]/g, "");

const REPORT_TEXTS = {
  reportReceived: (subject) => `Thanks for telling us about **${subject}**. We'll look into it, and we never tell anyone who reported them.`,
  reportActioned: (subject) => `We looked at your report about **${subject}** and took action. Thanks for helping keep Whisprl safe 💙`,
  reportDismissed: (subject, about) =>
    `We looked at your report about **${subject}** and didn't find it breaks our [rules](${PATH_DOCS.general.tnc}). If it keeps happening, you can ${about === "group" ? "leave the group" : "block them"}.`,
};

// what the app writes into a chat, from what each message is about; **bold** and [words](/path) are all the markup it uses
export const noticeOf = ({ type, user, name, username, gameName, about, text, button }, me, sender) => {
  // staff write an announcement themselves, markup and all
  if (type === "announcement") return { text, actions: button?.label ? [button] : [] };
  if (type === "challenge") {
    // the challenger reads what they sent, and only the one challenged is asked to answer
    if (sender._id === me._id) return { text: `You challenged **${plain(name)}** to **${gameName}** 🎮`, actions: [] };
    return {
      text: `**${plain(sender.firstName)}** challenged you to **${gameName}** 🎮`,
      actions: [
        { kind: "accept", label: "Play", whileInvited: true },
        { kind: "decline", label: "Not now", whileInvited: true },
      ],
    };
  }
  if (type === "welcome") {
    return {
      text: `Hi ${plain(me.firstName)}, I'm **Whisprl** 👋\n\nI don't chat, but I'm always up for a game: **Tic-tac-toe**, **Dots and Boxes**, **Chain Reaction** or **Jackaroo**. Pick one and I'll be ready.\n\nGames are better with company, so [invite your friends](/contacts) too.`,
      actions: [{ kind: "challenge", label: "Challenge Whisprl" }],
    };
  }
  if (REPORT_TEXTS[type]) return { text: REPORT_TEXTS[type](reportSubjectOf({ about, name: plain(name) }), about), actions: [] };
  if (type === "birthday") {
    return { text: `Happy birthday, **${plain(me.firstName)}** 🎂\n\nHope your day is full of good things. Thanks for being part of Whisprl 💙`, actions: [] };
  }
  if (type === "gameAdded") {
    return {
      text: `You asked for **${plain(name)}**, and it's here now 🎉\n\nWant to play it? I'm ready when you are.`,
      actions: [{ kind: "challenge", label: "Challenge Whisprl" }],
    };
  }
  if (type === "inviteJoined") {
    const profile = contactPathOf({ _id: user, username });
    return {
      text: `[${plain(name)}](${profile}) joined Whisprl from your invite 🎉\n\nSay hello, or challenge them to a game once you're friends.`,
      actions: [{ kind: "open", label: `See ${plain(name)}'s profile`, to: profile }],
    };
  }
  return null;
};
