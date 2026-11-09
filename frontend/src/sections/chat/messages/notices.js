import { contactPathOf } from "@/sections/contacts/contactsRoute";

// names are typed by people, so any markup in them is dropped rather than followed
const plain = (name) => name.replace(/[*[\]()]/g, "");

// what the app writes into a chat, from what each message is about; **bold** and [words](/path) are all the markup it uses
export const noticeOf = ({ type, user, name, username, gameName }, me, sender) => {
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
  if (type === "inviteJoined") {
    const profile = contactPathOf({ _id: user, username });
    return {
      text: `[${plain(name)}](${profile}) joined Whisprl from your invite 🎉\n\nSay hello, or challenge them to a game once you're friends.`,
      actions: [{ kind: "open", label: `See ${plain(name)}'s profile`, to: profile }],
    };
  }
  return null;
};
