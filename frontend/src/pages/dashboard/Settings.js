import { Box, useMediaQuery } from "@mui/material";
import { Navigate, useNavigate, useParams } from "react-router-dom";

import { LIST_WIDTH } from "@/components/Pane";
import { PAGE_HEIGHT_WITH_TAB_BAR } from "@/layouts/dashboard/NavRail";
import SettingsList from "@/sections/settings/SettingsList";
import SettingsPane from "@/sections/settings/SettingsPane";
import { CATEGORIES, PROFILE, SETTINGS_ROOT, settingsPathOf } from "@/sections/settings/settingsRoute";

// on a computer the categories sit beside the one that is open; on a phone each is a screen of its own
const Settings = () => {
  const navigate = useNavigate();
  const isWide = useMediaQuery((theme) => theme.breakpoints.up("md"));
  const { "*": slug = "" } = useParams();
  const category = [PROFILE, ...CATEGORIES].find((candidate) => candidate.slug === slug);

  if (slug && !category) return <Navigate to={SETTINGS_ROOT} replace />;
  if (isWide && !category) return <Navigate to={settingsPathOf(PROFILE)} replace />;

  return (
    <Box sx={{ display: "flex", flexGrow: 1, minWidth: 0, height: { xs: PAGE_HEIGHT_WITH_TAB_BAR, md: "100dvh" }, bgcolor: "chat.list" }}>
      {(isWide || !category) && (
        <Box sx={{ width: { xs: "100%", ...LIST_WIDTH }, flexShrink: 0, borderRight: (theme) => ({ xs: "none", md: `1px solid ${theme.palette.divider}` }) }}>
          <SettingsList current={slug} isWide={isWide} />
        </Box>
      )}
      {category && (
        <Box component="main" sx={{ flex: 1, minWidth: 0, bgcolor: { md: "chat.canvas" } }}>
          <SettingsPane category={category} onBack={isWide ? undefined : () => navigate(SETTINGS_ROOT)} />
        </Box>
      )}
    </Box>
  );
};

export default Settings;
