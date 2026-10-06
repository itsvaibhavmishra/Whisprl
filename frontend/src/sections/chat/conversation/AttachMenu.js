import { useState } from "react";
import { IconButton, ListItemIcon, ListItemText, Menu, MenuItem, Tooltip } from "@mui/material";
import { File, GameController, Image, Plus, User } from "phosphor-react";

const AttachMenu = ({ onMedia, onDocument, onContact }) => {
  const [anchor, setAnchor] = useState(null);

  const choices = [
    { label: "Photos and videos", icon: Image, onChoose: onMedia },
    { label: "Document", icon: File, onChoose: onDocument },
    { label: "Contact", icon: User, onChoose: onContact },
    { label: "Games", icon: GameController, hint: "Coming soon" },
  ];

  const choose = (onChoose) => {
    setAnchor(null);
    onChoose();
  };

  return (
    <>
      <Tooltip title="Attach">
        <IconButton aria-label="Attach" aria-haspopup="menu" onClick={(event) => setAnchor(event.currentTarget)}>
          <Plus size={22} />
        </IconButton>
      </Tooltip>
      <Menu
        anchorEl={anchor}
        open={Boolean(anchor)}
        onClose={() => setAnchor(null)}
        anchorOrigin={{ vertical: "top", horizontal: "left" }}
        transformOrigin={{ vertical: "bottom", horizontal: "left" }}
      >
        {choices.map(({ label, icon: Icon, onChoose, hint }) => (
          <MenuItem key={label} disabled={!onChoose} onClick={() => choose(onChoose)}>
            <ListItemIcon>
              <Icon size={20} />
            </ListItemIcon>
            <ListItemText primary={label} secondary={hint} />
          </MenuItem>
        ))}
      </Menu>
    </>
  );
};

export default AttachMenu;
