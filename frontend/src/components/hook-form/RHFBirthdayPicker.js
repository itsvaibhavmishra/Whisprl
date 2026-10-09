import dayjs from "dayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { Controller, useFormContext } from "react-hook-form";

import { EARLIEST_BIRTHDAY } from "@/utils/formRules";

const STORED = "YYYY-MM-DD";

// the form keeps the server's YYYY-MM-DD text, while the picker works in dates and shows "14 March 1995" the same in every country
const RHFBirthdayPicker = ({ name, label, helperText }) => {
  const { control } = useFormContext();

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState: { error } }) => (
        <DatePicker
          label={label}
          value={field.value ? dayjs(field.value) : null}
          onChange={(date) => field.onChange(!date ? "" : date.isValid() ? date.format(STORED) : "invalid")}
          format="DD MMMM YYYY"
          openTo="year"
          views={["year", "month", "day"]}
          minDate={dayjs(EARLIEST_BIRTHDAY)}
          maxDate={dayjs()}
          // a phone names the field itself after this, so it has to carry the visible label for screen readers and voice control
          localeText={{ openDatePickerDialogue: () => `Choose ${label.toLowerCase()}` }}
          slotProps={{
            textField: { fullWidth: true, sx: { mt: 1 }, onBlur: field.onBlur, error: Boolean(error), helperText: error ? error.message : helperText },
          }}
        />
      )}
    />
  );
};

export default RHFBirthdayPicker;
