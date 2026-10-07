import { useState } from "react";
import { Box, IconButton, ListItemText, Menu, MenuItem, Tooltip } from "@mui/material";
import { File, GameController, Image, Plus, User } from "phosphor-react";

import { gradientOf } from "@/utils/gradients";

const AttachMenu = ({ onMedia, onDocument, onContact }) => {
  const [anchor, setAnchor] = useState(null);
  const isOpen = Boolean(anchor);

  const choices = [
    { label: "Photos and videos", icon: Image, background: gradientOf(["#7444E0", "#C2399E"]), onChoose: onMedia },
    { label: "Document", icon: File, background: gradientOf(["#2453D6", "#3E86E8"]), onChoose: onDocument },
    { label: "Contact", icon: User, background: gradientOf(["#0B7F75", "#1F8FA8"]), onChoose: onContact },
    { label: "Games", icon: GameController, background: gradientOf(["#C2560F", "#D23A4E"]), hint: "Coming soon" },
  ];

  const choose = (onChoose) => {
    setAnchor(null);
    onChoose();
  };

  return (
    <>
      <Tooltip title="Attach">
        <IconButton
          aria-label="Attach"
          aria-haspopup="menu"
          aria-expanded={isOpen}
          onClick={(event) => setAnchor(event.currentTarget)}
          sx={{ color: isOpen ? "primary.main" : "text.secondary" }}
        >
          <Box component="span" sx={{ display: "grid", transition: "transform 200ms ease", transform: isOpen ? "rotate(45deg)" : "none" }}>
            <Plus size={22} weight="bold" />
          </Box>
        </IconButton>
      </Tooltip>
      <Menu
        anchorEl={anchor}
        open={isOpen}
        onClose={() => setAnchor(null)}
        anchorOrigin={{ vertical: "top", horizontal: "left" }}
        transformOrigin={{ vertical: "bottom", horizontal: "left" }}
        slotProps={{ paper: { sx: { mt: -1, minWidth: 220 } } }}
      >
        {choices.map(({ label, icon: Icon, background, onChoose, hint }) => (
          <MenuItem key={label} disabled={!onChoose} onClick={() => choose(onChoose)} sx={{ py: 0.75 }}>
            <Box sx={{ width: 34, height: 34, borderRadius: "50%", display: "grid", placeItems: "center", color: "#fff", background, flexShrink: 0 }}>
              <Icon size={18} weight="fill" />
            </Box>
            <ListItemText primary={label} secondary={hint} primaryTypographyProps={{ fontWeight: 700, fontSize: 14 }} />
          </MenuItem>
        ))}
      </Menu>
    </>
  );
};

export default AttachMenu;
