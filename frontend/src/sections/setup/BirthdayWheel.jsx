import { Fragment, useLayoutEffect, useRef, useState } from "react";
import { Box, FormHelperText, InputBase, Stack } from "@mui/material";
import { Controller, useFormContext } from "react-hook-form";

import { BIRTHDAY_PARTS, dateValueOf } from "@/components/hook-form/RHFBirthdayPicker";

const ROW = 44;
const SHOWN_ROWS = 5;
const SETTLE_MS = 120;
const NOTHING_TYPED = { day: "", month: "", year: "" };
const WIDTHS = { day: "24%", month: "44%", year: "32%" };
const FIELDS = {
  day: { size: 2, placeholder: "DD", label: "Day of birth", autoComplete: "bday-day" },
  month: { size: 2, placeholder: "MM", label: "Month of birth", autoComplete: "bday-month" },
  year: { size: 4, placeholder: "YYYY", label: "Year of birth", autoComplete: "bday-year" },
};

const isComplete = (chosen) => BIRTHDAY_PARTS.every(({ part }) => chosen[part]);

const optionsOf = (part) => BIRTHDAY_PARTS.find((each) => each.part === part).options;

const textOf = (part, value) => (value ? String(value).padStart(FIELDS[part].size, "0") : "");

// a digit is kept only while its part can still become one of the wheel's choices, so no day past 31, month past 12 or year past this one
const canBecome = (part, typed) => {
  const { size } = FIELDS[part];
  const lowest = Number(typed.padEnd(size, "0"));
  const highest = Number(typed.padEnd(size, "9"));
  return optionsOf(part).some((option) => option.value >= lowest && option.value <= highest);
};

const keptDigits = (part, typed) =>
  [...typed.replace(/\D/g, "")].reduce((kept, digit) => (kept.length < FIELDS[part].size && canBecome(part, kept + digit) ? kept + digit : kept), "");

const valueOf = (part, text) => (text.length === FIELDS[part].size ? Number(text) : "");

const valuesOf = (texts) => Object.fromEntries(BIRTHDAY_PARTS.map(({ part }) => [part, valueOf(part, texts[part])]));

// styled directly on every scroll, since a re-render trails the finger
const shadeByDistance = (list) => {
  const middle = list.scrollTop / ROW;
  [...list.children].forEach((row, index) => {
    const distance = Math.abs(index - middle);
    row.style.transform = `scale(${1 + 0.2 * Math.max(0, 1 - distance)})`;
    row.style.opacity = Math.max(0.25, 1 - distance * 0.3);
  });
};

// each wheel opens on its own name rather than a date, so nobody is handed an age they did not choose
const Wheel = ({ label, options, value, width, onChange }) => {
  const rows = [{ value: "", label }, ...options];
  const listRef = useRef(null);
  const settleRef = useRef(null);
  const selected = Math.max(
    0,
    rows.findIndex((row) => row.value === value)
  );

  // a typed date turns the wheel to it, where a wheel the finger turned is already there
  useLayoutEffect(() => {
    const list = listRef.current;
    if (Math.round(list.scrollTop / ROW) !== selected) list.scrollTo({ top: selected * ROW, behavior: "smooth" });
    shadeByDistance(list);
  }, [selected]);

  const scrollTo = (index) => listRef.current.scrollTo({ top: index * ROW, behavior: "smooth" });

  const settle = () => {
    const list = listRef.current;
    shadeByDistance(list);
    clearTimeout(settleRef.current);
    settleRef.current = setTimeout(() => {
      const index = Math.min(rows.length - 1, Math.round(list.scrollTop / ROW));
      if (rows[index].value !== value) onChange(rows[index].value);
    }, SETTLE_MS);
  };

  const step = (event) => {
    const move = { ArrowDown: 1, ArrowUp: -1 }[event.key];
    if (!move) return;
    event.preventDefault();
    scrollTo(Math.min(rows.length - 1, Math.max(0, selected + move)));
  };

  return (
    <Box
      ref={listRef}
      role="listbox"
      aria-label={label}
      tabIndex={0}
      onScroll={settle}
      onKeyDown={step}
      sx={{
        width,
        height: ROW * SHOWN_ROWS,
        overflowY: "auto",
        scrollSnapType: "y mandatory",
        py: `${ROW * Math.floor(SHOWN_ROWS / 2)}px`,
        scrollbarWidth: "none",
        "&::-webkit-scrollbar": { display: "none" },
        maskImage: "linear-gradient(transparent, #000 35%, #000 65%, transparent)",
        "&:focus-visible": { outline: "none", "& [aria-selected=true]": { textDecoration: "underline" } },
      }}
    >
      {rows.map((row, index) => (
        <Box
          key={row.value || "none"}
          role="option"
          aria-selected={index === selected}
          onClick={() => scrollTo(index)}
          sx={{
            height: ROW,
            display: "grid",
            placeItems: "center",
            scrollSnapAlign: "center",
            cursor: "pointer",
            fontSize: 18,
            fontWeight: 600,
            color: row.value ? "text.primary" : "text.secondary",
          }}
        >
          {row.label}
        </Box>
      ))}
    </Box>
  );
};

const BirthdayWheel = ({ name }) => {
  const { control } = useFormContext();
  const [texts, setTexts] = useState(NOTHING_TYPED);
  const chosen = valuesOf(texts);
  const fieldsRef = useRef({});

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState: { error } }) => {
        const keep = (changes) => {
          const nextTexts = { ...texts, ...changes };
          const next = valuesOf(nextTexts);
          setTexts(nextTexts);
          field.onChange(isComplete(next) ? dateValueOf(next) : "");
        };

        const focusPart = (part, isAtEnd) => {
          const input = fieldsRef.current[part];
          input.focus();
          if (isAtEnd) input.setSelectionRange(input.value.length, input.value.length);
        };

        const type = (part, index) => (event) => {
          const { size } = FIELDS[part];
          const typed = event.target.value.replace(/\D/g, "");
          const text = keptDigits(part, typed.slice(0, size));
          const nextPart = BIRTHDAY_PARTS[index + 1]?.part;
          const previousPart = BIRTHDAY_PARTS[index - 1]?.part;
          const carried = nextPart && typed.length > size ? keptDigits(nextPart, typed.slice(size)) : "";
          keep({ [part]: text, ...(carried && { [nextPart]: carried }) });
          if (nextPart && (text.length === size || carried)) setTimeout(() => focusPart(nextPart, Boolean(carried)));
          // Android keyboards send no Backspace from an empty field, so erasing the last digit is what steps back
          if (previousPart && !text && texts[part]) setTimeout(() => focusPart(previousPart, true));
        };

        const stepBack = (index) => (event) => {
          if (event.key === "Backspace" && !event.currentTarget.value && index > 0) {
            event.preventDefault();
            focusPart(BIRTHDAY_PARTS[index - 1].part, true);
          }
        };

        return (
          <Box>
            <Stack
              direction="row"
              sx={{ justifyContent: "center", alignItems: "baseline", pb: 1, borderBottom: 1, borderColor: "divider", fontSize: 28, fontWeight: 600 }}
            >
              {BIRTHDAY_PARTS.map(({ part }, index) => (
                <Fragment key={part}>
                  {index > 0 && (
                    <Box component="span" aria-hidden sx={{ whiteSpace: "pre", color: "text.disabled" }}>
                      {" / "}
                    </Box>
                  )}
                  {/* a hidden copy of what the field shows sets its width, so the line spaces like one piece of text */}
                  <Box sx={{ position: "relative" }}>
                    <Box component="span" aria-hidden sx={{ visibility: "hidden", whiteSpace: "pre", fontVariantNumeric: "tabular-nums" }}>
                      {texts[part] || FIELDS[part].placeholder}
                    </Box>
                    <InputBase
                      inputRef={(element) => {
                        fieldsRef.current[part] = element;
                      }}
                      value={texts[part]}
                      onChange={type(part, index)}
                      onKeyDown={stepBack(index)}
                      onFocus={(event) => event.target.select()}
                      onBlur={field.onBlur}
                      placeholder={FIELDS[part].placeholder}
                      inputProps={{ inputMode: "numeric", autoComplete: FIELDS[part].autoComplete, "aria-label": FIELDS[part].label }}
                      sx={{
                        position: "absolute",
                        inset: 0,
                        font: "inherit",
                        "& input": { p: 0, width: "100%", textAlign: "center", fontVariantNumeric: "tabular-nums" },
                        "& input::placeholder": { color: "text.disabled", opacity: 1 },
                      }}
                    />
                  </Box>
                </Fragment>
              ))}
            </Stack>
            <Stack direction="row" sx={{ position: "relative", mt: 4 }}>
              <Box
                aria-hidden
                sx={{
                  position: "absolute",
                  insetInline: 0,
                  top: ROW * Math.floor(SHOWN_ROWS / 2),
                  height: ROW,
                  borderTop: 1,
                  borderBottom: 1,
                  borderColor: "divider",
                  pointerEvents: "none",
                }}
              />
              {BIRTHDAY_PARTS.map(({ part, label, options }) => (
                <Wheel
                  key={part}
                  label={label}
                  options={options}
                  value={chosen[part]}
                  width={WIDTHS[part]}
                  onChange={(picked) => keep({ [part]: textOf(part, picked) })}
                />
              ))}
            </Stack>
            {error && (
              <FormHelperText error sx={{ mt: 1.5, textAlign: "center" }}>
                {error.message}
              </FormHelperText>
            )}
          </Box>
        );
      }}
    />
  );
};

export default BirthdayWheel;
