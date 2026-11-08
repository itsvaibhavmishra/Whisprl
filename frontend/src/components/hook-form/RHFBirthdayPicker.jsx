import { useState } from "react";
import { FormHelperText, Stack, TextField } from "@mui/material";
import { Controller, useFormContext } from "react-hook-form";

import { EARLIEST_BIRTHDAY } from "@/utils/formRules";

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const FIRST_YEAR = Number(EARLIEST_BIRTHDAY.slice(0, 4));

const numbersFrom = (first, count) => Array.from({ length: count }, (_, index) => first + index);

const PARTS = [
  { part: "day", label: "Day", width: "26%", options: numbersFrom(1, 31).map((day) => ({ value: day, label: day })) },
  { part: "month", label: "Month", width: "40%", options: MONTHS.map((month, index) => ({ value: index + 1, label: month })) },
  {
    part: "year",
    label: "Year",
    width: "34%",
    options: numbersFrom(FIRST_YEAR, new Date().getFullYear() - FIRST_YEAR + 1)
      .reverse()
      .map((year) => ({ value: year, label: year })),
  },
];

const NOTHING_CHOSEN = { day: "", month: "", year: "" };

const partsOf = (value) => {
  const [year, month, day] = value.split("-").map(Number);
  return { day, month, year };
};

const twoDigits = (number) => String(number).padStart(2, "0");

// the phone's own list for each part is easier than a calendar, and the form still keeps the server's YYYY-MM-DD text
const RHFBirthdayPicker = ({ name, label, helperText }) => {
  const { control } = useFormContext();
  const [chosen, setChosen] = useState(NOTHING_CHOSEN);

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState: { error } }) => {
        const shown = field.value ? partsOf(field.value) : chosen;

        const choose = (part, picked) => {
          const next = { ...shown, [part]: picked };
          setChosen(next);
          if (next.day && next.month && next.year) field.onChange(`${next.year}-${twoDigits(next.month)}-${twoDigits(next.day)}`);
        };

        return (
          <Stack role="group" aria-label={label} sx={{ mt: 1 }}>
            <Stack direction="row" spacing={1.5}>
              {PARTS.map(({ part, label: partLabel, width, options }) => (
                <TextField
                  key={part}
                  select
                  label={partLabel}
                  value={shown[part]}
                  error={Boolean(error)}
                  onChange={(event) => choose(part, Number(event.target.value))}
                  onBlur={field.onBlur}
                  slotProps={{ select: { native: true } }}
                  sx={{ flexBasis: width, minWidth: 0 }}
                >
                  <option value="" disabled />
                  {options.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </TextField>
              ))}
            </Stack>
            {(error || helperText) && (
              <FormHelperText variant="outlined" error={Boolean(error)}>
                {error ? error.message : helperText}
              </FormHelperText>
            )}
          </Stack>
        );
      }}
    />
  );
};

export default RHFBirthdayPicker;
