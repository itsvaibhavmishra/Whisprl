import { Box, ButtonBase, Stack } from "@mui/material";
import {
  AirplaneTiltIcon,
  FlagIcon,
  HamburgerIcon,
  HandWavingIcon,
  HeartIcon,
  LightbulbIcon,
  PawPrintIcon,
  SmileyIcon,
  SoccerBallIcon,
} from "@phosphor-icons/react";

export const CATEGORY_ICONS = {
  "Smileys & emotion": SmileyIcon,
  "People & body": HandWavingIcon,
  "Animals & nature": PawPrintIcon,
  "Food & drink": HamburgerIcon,
  "Travel & places": AirplaneTiltIcon,
  Activities: SoccerBallIcon,
  Objects: LightbulbIcon,
  Symbols: HeartIcon,
  Flags: FlagIcon,
};

const CategoryBar = ({ categories, active, onPick }) => {
  const activeIndex = Math.max(0, categories.indexOf(active));
  return (
    <Stack direction="row" role="toolbar" aria-label="Emoji categories" sx={{ position: "relative", flexShrink: 0, borderTop: 1, borderColor: "divider" }}>
      {categories.map((label) => {
        const Icon = CATEGORY_ICONS[label];
        const isActive = label === active;
        return (
          <ButtonBase
            key={label}
            aria-label={label}
            aria-current={isActive || undefined}
            onClick={() => onPick(label)}
            sx={{ flex: 1, height: 44, color: isActive ? "primary.main" : "text.secondary", "&:hover": { color: "text.primary" } }}
          >
            <Icon size={20} weight={isActive ? "fill" : "regular"} />
          </ButtonBase>
        );
      })}
      <Box
        aria-hidden="true"
        sx={{
          position: "absolute",
          top: -1,
          left: 0,
          width: `${100 / categories.length}%`,
          height: 2,
          bgcolor: "primary.main",
          transform: `translateX(${activeIndex * 100}%)`,
          transition: "transform 220ms cubic-bezier(0.2, 0.8, 0.3, 1)",
          "@media (prefers-reduced-motion: reduce)": { transition: "none" },
        }}
      />
    </Stack>
  );
};

export default CategoryBar;
