import { useState } from "react";
import { FormHelperText, Stack, TextField } from "@mui/material";
import { Controller, useFormContext } from "react-hook-form";

import { EARLIEST_BIRTHDAY } from "@/utils/formRules";

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const DAYS = Array.from({ length: 31 }, (_, index) => index + 1);
const FIRST_YEAR = Number(EARLIEST_BIRTHDAY.slice(0, 4));
const YEARS = Array.from({ length: new Date().getFullYear() - FIRST_YEAR + 1 }, (_, index) => FIRST_YEAR + index).reverse();

const NOTHING_CHOSEN = { day: "", month: "", year: "" };

const partsOf = (value) => {
  const [year, month, day] = value.split("-").map(Number);
  return { day, month, year };
};

const twoDigits = (number) => String(number).padStart(2, "0");

const PART_WIDTHS = { day: "26%", month: "40%", year: "34%" };

const PartSelect = ({ label, part, value, options, hasError, onChoose, onBlur }) => (
  <TextField
    select
    label={label}
    value={value}
    error={hasError}
    onChange={(event) => onChoose(part, Number(event.target.value))}
    onBlur={onBlur}
    slotProps={{ select: { native: true } }}
    sx={{ flexBasis: PART_WIDTHS[part], minWidth: 0 }}
  >
    <option value="" disabled />
    {options.map(({ value: optionValue, label: optionLabel }) => (
      <option key={optionValue} value={optionValue}>
        {optionLabel}
      </option>
    ))}
  </TextField>
);

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

        const partProps = { hasError: Boolean(error), onChoose: choose, onBlur: field.onBlur };

        return (
          <Stack role="group" aria-label={label} sx={{ mt: 1 }}>
            <Stack direction="row" spacing={1.5}>
              <PartSelect label="Day" part="day" value={shown.day} options={DAYS.map((day) => ({ value: day, label: day }))} {...partProps} />
              <PartSelect
                label="Month"
                part="month"
                value={shown.month}
                options={MONTHS.map((month, index) => ({ value: index + 1, label: month }))}
                {...partProps}
              />
              <PartSelect label="Year" part="year" value={shown.year} options={YEARS.map((year) => ({ value: year, label: year }))} {...partProps} />
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
