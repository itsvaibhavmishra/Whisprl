import { useState } from "react";
import { ShieldWarningIcon } from "@phosphor-icons/react";

import { SecurityCodeDialog } from "@/components/profile/SecurityCode";
import ChatNote from "@/sections/chat/conversation/ChatNote";
import { CENTRED } from "@/sections/chat/conversation/messageColumn";

const KeyChangeNote = ({ person }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <>
      <ChatNote
        component="button"
        type="button"
        onClick={() => setIsOpen(true)}
        aria-label={`${person.firstName}'s security code changed. Check it`}
        sx={{ ...CENTRED, border: 0, cursor: "pointer", fontFamily: "inherit", display: "inline-flex", alignItems: "center", gap: 0.75 }}
      >
        <ShieldWarningIcon size={14} weight="bold" aria-hidden />
        {person.firstName}&apos;s security code changed
      </ChatNote>
      {isOpen && <SecurityCodeDialog person={person} onClose={() => setIsOpen(false)} />}
    </>
  );
};

export default KeyChangeNote;
