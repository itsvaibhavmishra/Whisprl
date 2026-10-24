import { forwardRef } from "react";
import { IconButton, InputBase, Stack } from "@mui/material";
import { MagnifyingGlass, X } from "phosphor-react";

const SearchPill = forwardRef(({ value, onChange, label, sx }, ref) => (
  <Stack
    direction="row"
    alignItems="center"
    spacing={1}
    sx={{
      height: 42,
      px: 1.5,
      borderRadius: 99,
      bgcolor: "chat.field",
      color: "text.secondary",
      border: 1.5,
      borderColor: "transparent",
      transition: "border-color 160ms ease, background-color 160ms ease",
      "&:focus-within": { borderColor: "primary.main", bgcolor: "chat.list" },
      ...sx,
    }}
  >
    <MagnifyingGlass size={18} weight="bold" />
    <InputBase
      inputRef={ref}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={label}
      inputProps={{ "aria-label": label }}
      sx={{ flex: 1, fontSize: 14, fontWeight: 500, color: "text.primary" }}
    />
    {value && (
      <IconButton size="small" aria-label="Clear search" onClick={() => onChange("")} sx={{ mr: -0.75 }}>
        <X size={14} weight="bold" />
      </IconButton>
    )}
  </Stack>
));

export default SearchPill;
