import { useState } from "react";
import { IconButton, Popover, Stack, Tooltip } from "@mui/material";
import { Palette } from "phosphor-react";

import { AccentPicker, ThemeModePicker } from "@/components/AppearancePickers";

const AppearanceMenu = () => {
  const [anchor, setAnchor] = useState(null);

  return (
    <>
      <Tooltip title="Appearance">
        <IconButton aria-label="Change appearance" aria-haspopup="dialog" color="inherit" onClick={(event) => setAnchor(event.currentTarget)}>
          <Palette size={22} />
        </IconButton>
      </Tooltip>
      <Popover
        open={!!anchor}
        anchorEl={anchor}
        onClose={() => setAnchor(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        slotProps={{ paper: { sx: { mt: 1, p: 2.5, width: 380, maxWidth: "calc(100vw - 32px)", borderRadius: 3 } } }}
      >
        <Stack spacing={3}>
          <ThemeModePicker />
          <AccentPicker />
        </Stack>
      </Popover>
    </>
  );
};

export default AppearanceMenu;
