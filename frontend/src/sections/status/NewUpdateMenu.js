import { IconButton, ListItemIcon, Menu, MenuItem, Tooltip } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { ImageSquare, Plus, TextT } from "phosphor-react";

export const NewUpdateButton = ({ onOpen, disabled }) => (
  <Tooltip title="New update">
    <span>
      <IconButton
        aria-label="New update"
        aria-haspopup="menu"
        onClick={(event) => onOpen(event.currentTarget)}
        disabled={disabled}
        sx={{ width: 40, height: 40, color: "primary.main", bgcolor: (theme) => alpha(theme.palette.primary.main, 0.1), "&:hover": { bgcolor: (theme) => alpha(theme.palette.primary.main, 0.18) } }}
      >
        <Plus size={20} weight="bold" />
      </IconButton>
    </span>
  </Tooltip>
);

const NewUpdateMenu = ({ anchor, onClose, onWrite, onChooseMedia }) => {
  const choose = (action) => () => {
    onClose();
    action();
  };

  return (
    <Menu anchorEl={anchor} open={Boolean(anchor)} onClose={onClose} anchorOrigin={{ vertical: "bottom", horizontal: "right" }} transformOrigin={{ vertical: "top", horizontal: "right" }}>
      <MenuItem onClick={choose(onWrite)}>
        <ListItemIcon>
          <TextT size={20} />
        </ListItemIcon>
        Write
      </MenuItem>
      <MenuItem onClick={choose(onChooseMedia)}>
        <ListItemIcon>
          <ImageSquare size={20} />
        </ListItemIcon>
        Photo or video
      </MenuItem>
    </Menu>
  );
};

export default NewUpdateMenu;
