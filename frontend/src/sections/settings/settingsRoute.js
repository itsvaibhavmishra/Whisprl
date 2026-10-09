import { ChatCircleDots, Info, LockKey, Palette, ShieldCheck, Sparkle, UserCircle } from "phosphor-react";

import { PATH_DASHBOARD } from "@/routes/paths";
import { colorPresets } from "@/utils/colorPresets";

export const SETTINGS_ROOT = PATH_DASHBOARD.general.settings;

// each category takes one of the accent colours, so the list reads in Whisprl's own palette
const accent = (name) => colorPresets.find((preset) => preset.name === name).main;

export const CATEGORIES = [
  {
    slug: "appearance",
    label: "Appearance",
    description: "Theme, accent colour and wallpaper",
    note: "Changes apply straight away and are saved on this device.",
    icon: Palette,
    tint: accent("purple"),
    group: 0,
  },
  { slug: "chats", label: "Chats", description: "Reactions, sounds, notifications and blocked people", icon: ChatCircleDots, tint: accent("default"), group: 0 },
  { slug: "account", label: "Account", description: "Your profile, username and email", icon: UserCircle, tint: accent("blue"), group: 1 },
  { slug: "security", label: "Security", description: "Password, passkeys and your recovery key", icon: ShieldCheck, tint: accent("cyan"), group: 1 },
  { slug: "privacy", label: "Privacy", description: "Who sees your status, suggestions and birthday", icon: LockKey, tint: accent("orange"), group: 1 },
  { slug: "whats-new", label: "What's new", description: "The highlights of each release", icon: Sparkle, tint: accent("red"), group: 2 },
  { slug: "about", label: "About Whisprl", description: "Terms, source code and reporting a problem", icon: Info, tint: "grey.600", group: 2 },
];

// your profile opens from the card above the list rather than from a row in it
export const PROFILE = {
  slug: "profile",
  label: "Profile",
  note: "This is the card your friends see when they open your profile. Change anything and it updates as you type.",
};

export const settingsPathOf = (category) => `${SETTINGS_ROOT}/${category.slug}`;
