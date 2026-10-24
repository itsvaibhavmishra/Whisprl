import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { Box, Button, CircularProgress, Collapse, Stack, Typography } from "@mui/material";
import { MagnifyingGlassIcon } from "@phosphor-icons/react";
import { EmojiPicker as Picker } from "frimousse";
import { useReducedMotion } from "motion/react";

import CategoryBar, { CATEGORY_ICONS } from "@/components/emoji-picker/CategoryBar";
import SkinTonePicker from "@/components/emoji-picker/SkinTonePicker";
import { EMOJI_BUTTON, emojiButtonSx, markedSx, tappableSx } from "@/components/emoji-picker/emojiStyles";
import { recentEmoji, rememberEmoji, savedSkinTone, saveSkinTone } from "@/components/emoji-picker/emojiPreferences";

const MAX_COLUMNS = 9;
const SIDE_PADDING = 8;
// a popover keeps 16px clear of each edge of the screen
const SCREEN_MARGINS = 32;
const PICKER_HEIGHT = 435;
// served by the app, see vite.config.mjs
const EMOJI_DATA_URL = "/emojibase";

const headerSx = { px: 1, py: 0.75, fontSize: 13, fontWeight: 700, color: "text.secondary", bgcolor: "background.paper" };

// a browser without flag emoji gets no flags section, so the bar shows the sections the list actually has
const SectionFound = createContext(null);

const CategoryHeader = ({ category, ...props }) => {
  const found = useContext(SectionFound);
  useEffect(() => found(category.label), [found, category.label]);
  return (
    <div {...props} data-category={category.label}>
      {category.label}
    </div>
  );
};

const EmojiRow = ({ title, action, emojis, markedIndex, note, columns, onPick }) => (
  <Box>
    <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between", pr: 1 }}>
      <Typography sx={headerSx}>{title}</Typography>
      {action && (
        <Button size="small" onClick={action.onClick} sx={{ minWidth: 0, py: 0, fontWeight: 700 }}>
          {action.label}
        </Button>
      )}
    </Stack>
    <Stack direction="row" sx={{ px: `${SIDE_PADDING}px` }}>
      {emojis.slice(0, columns).map((emoji, index) => (
        <Box
          component="button"
          type="button"
          key={`${index}-${emoji}`}
          aria-pressed={index === markedIndex || undefined}
          onClick={() => onPick(emoji, index)}
          sx={(theme) => ({ ...tappableSx, width: `${100 / columns}%`, ...(index === markedIndex && markedSx(theme)) })}
        >
          {emoji}
        </Box>
      ))}
    </Stack>
    {note && <Typography sx={{ px: 1, pt: 0.5, fontSize: 12, color: "text.secondary" }}>{note}</Typography>}
  </Box>
);

const EmojiPicker = ({ onSelect, autoFocus = true, isPanel = false, pinned }) => {
  const [search, setSearch] = useState("");
  const [recent, setRecent] = useState(recentEmoji);
  const [skinTone, setSkinTone] = useState(savedSkinTone);
  const [sections, setSections] = useState([]);
  const [active, setActive] = useState(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const [panelWidth, setPanelWidth] = useState(0);
  const viewportRef = useRef(null);
  const isStill = useReducedMotion();

  // a panel takes the width of wherever it sits, which on a computer is the chat's column rather than the window
  const watchWidth = useCallback((node) => {
    if (!node) return undefined;
    const observer = new ResizeObserver(([entry]) => setPanelWidth(entry.contentRect.width));
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const room = isPanel ? panelWidth || window.innerWidth : window.innerWidth - SCREEN_MARGINS;
  const columns = Math.min(isPanel ? Infinity : MAX_COLUMNS, Math.floor((room - 2 * SIDE_PADDING) / EMOJI_BUTTON));
  const categories = Object.keys(CATEGORY_ICONS).filter((label) => sections.includes(label));

  const found = useCallback((label) => setSections((known) => (known.includes(label) ? known : [...known, label])), []);

  const sectionTop = (label) => {
    const viewport = viewportRef.current;
    const section = viewport?.querySelector(`[data-category="${label}"]`)?.closest("[frimousse-category]");
    return section ? section.getBoundingClientRect().top - viewport.getBoundingClientRect().top + viewport.scrollTop : null;
  };
  const showSection = (label) => viewportRef.current?.scrollTo({ top: sectionTop(label) ?? 0, behavior: isStill ? "instant" : "smooth" });
  const followScroll = () => {
    const { scrollTop } = viewportRef.current;
    setIsScrolled(scrollTop > EMOJI_BUTTON);
    setActive(categories.filter((label) => (sectionTop(label) ?? Infinity) <= scrollTop + 1).at(-1) ?? null);
  };
  const searchFor = (text) => {
    setSearch(text);
    setActive(null);
  };

  const select = (emoji) => {
    setRecent(rememberEmoji(emoji));
    onSelect(emoji);
  };
  const chooseSkinTone = (tone) => {
    setSkinTone(tone);
    saveSkinTone(tone);
  };

  const hasRows = Boolean(pinned) || recent.length > 0;

  return (
    <SectionFound value={found}>
      <Box
        component={Picker.Root}
        ref={isPanel ? watchWidth : undefined}
        onEmojiSelect={({ emoji }) => select(emoji)}
        columns={columns}
        skinTone={skinTone}
        emojibaseUrl={EMOJI_DATA_URL}
        sx={{
          display: "flex",
          flexDirection: "column",
          width: isPanel ? "100%" : columns * EMOJI_BUTTON + 2 * SIDE_PADDING,
          height: isPanel ? "100%" : PICKER_HEIGHT,
          bgcolor: "background.paper",
          // the list's own elements are styled once from here, so redrawing hundreds of emoji as the panel resizes stays cheap
          "& [frimousse-row]": { px: `${SIDE_PADDING}px` },
          "& [frimousse-emoji]": { ...emojiButtonSx, width: `${100 / columns}%`, "&[data-active]": { bgcolor: "action.hover" } },
          "& [frimousse-category-header]": headerSx,
        }}
      >
        <Stack direction="row" spacing={1} sx={{ alignItems: "center", px: `${SIDE_PADDING}px`, pt: 1, pb: 0.5 }}>
          <Stack
            direction="row"
            spacing={1}
            sx={{ flex: 1, alignItems: "center", height: 36, px: 1.5, borderRadius: 99, bgcolor: "chat.field", color: "text.secondary" }}
          >
            <MagnifyingGlassIcon size={16} weight="bold" />
            <Box
              component={Picker.Search}
              value={search}
              onChange={(event) => searchFor(event.target.value)}
              placeholder="Search emoji"
              aria-label="Search emoji"
              autoFocus={autoFocus}
              sx={{ flex: 1, minWidth: 0, p: 0, border: 0, outline: 0, bgcolor: "transparent", color: "text.primary", font: "inherit", fontSize: 14 }}
            />
          </Stack>
          <SkinTonePicker skinTone={skinTone} onChange={chooseSkinTone} />
        </Stack>
        {/* the rows above the list fold away once it scrolls, so the list gets the room, and come back at its top */}
        <Collapse in={hasRows && (Boolean(pinned?.keepsOpen) || (!search && !isScrolled))} sx={{ flexShrink: 0 }}>
          {pinned && <EmojiRow {...pinned} columns={columns} />}
          {recent.length > 0 && !search && <EmojiRow title="Recent" emojis={recent} columns={columns} onPick={select} />}
        </Collapse>
        <Box
          component={Picker.Viewport}
          ref={viewportRef}
          onScroll={followScroll}
          sx={{ position: "relative", flex: 1, minHeight: 0, outline: 0, scrollbarWidth: "none", "&::-webkit-scrollbar": { display: "none" } }}
        >
          <Box component={Picker.Loading} sx={{ position: "absolute", inset: 0, display: "grid", placeItems: "center" }}>
            <CircularProgress size={24} aria-label="Loading emoji" />
          </Box>
          <Box component={Picker.Empty} sx={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", fontSize: 14, color: "text.secondary" }}>
            No emoji found
          </Box>
          <Picker.List components={{ CategoryHeader }} />
        </Box>
        {!search && categories.length > 0 && <CategoryBar categories={categories} active={active ?? categories[0]} onPick={showSection} />}
      </Box>
    </SectionFound>
  );
};

export default EmojiPicker;
