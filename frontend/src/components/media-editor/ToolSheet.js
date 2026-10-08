import { Drawer, Popover, Stack, useMediaQuery } from "@mui/material";

const ToolSheet = ({ anchor, label, onClose, children }) => {
  const isWide = useMediaQuery((theme) => theme.breakpoints.up("md"));
  const paper = { role: "dialog", "aria-label": label };

  if (isWide) {
    return (
      <Popover
        open
        anchorEl={anchor}
        onClose={onClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
        transformOrigin={{ vertical: "top", horizontal: "left" }}
        PaperProps={{ ...paper, sx: { mt: 1, borderRadius: 3, overflow: "hidden" } }}
      >
        {children}
      </Popover>
    );
  }

  return (
    <Drawer anchor="bottom" open onClose={onClose} sx={{ zIndex: "modal" }} PaperProps={{ ...paper, sx: { maxHeight: "85dvh", borderTopLeftRadius: 20, borderTopRightRadius: 20 } }}>
      <Stack alignItems="center" sx={{ py: 1 }}>
        {children}
      </Stack>
    </Drawer>
  );
};

export default ToolSheet;
