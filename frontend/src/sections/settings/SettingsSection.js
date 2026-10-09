import { useId } from "react";
import { Box, ButtonBase, Typography } from "@mui/material";
import { CaretRight } from "phosphor-react";

const rowLayout = {
  display: "flex",
  flexWrap: "wrap",
  alignItems: "center",
  justifyContent: "space-between",
  columnGap: 3,
  rowGap: 2,
  py: 2.5,
  borderBottom: 1,
  borderColor: "divider",
};

const RowText = ({ label, description }) => (
  <Box sx={{ minWidth: 0, flex: "1 1 220px", textAlign: "left" }}>
    <Typography sx={{ fontWeight: 600 }}>{label}</Typography>
    {description && (
      <Typography variant="body2" sx={{ mt: 0.5, color: "text.secondary", fontWeight: 400, overflowWrap: "anywhere" }}>
        {description}
      </Typography>
    )}
  </Box>
);

export const SettingsSection = ({ title, children }) => {
  const titleId = useId();
  return (
    <Box component="section" aria-labelledby={title ? titleId : undefined}>
      {title && (
        <Typography id={titleId} component="h3" sx={{ m: 0, mb: 1, fontSize: 16, fontWeight: 700 }}>
          {title}
        </Typography>
      )}
      <Box sx={{ borderTop: 1, borderColor: "divider" }}>{children}</Box>
    </Box>
  );
};

export const SettingRow = ({ label, description, children }) => (
  <Box sx={rowLayout}>
    <RowText label={label} description={description} />
    {children}
  </Box>
);

export const SettingLink = ({ label, description, leading, icon: Icon = CaretRight, ...link }) => (
  <ButtonBase
    {...link}
    sx={{ ...rowLayout, flexWrap: "nowrap", width: "100%", "&:hover": { bgcolor: "action.hover" } }}
  >
    {leading}
    <RowText label={label} description={description} />
    <Icon size={20} aria-hidden="true" />
  </ButtonBase>
);
