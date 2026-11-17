import { FormControl, FormControlLabel, FormHelperText, FormLabel, Radio, RadioGroup } from "@mui/material";
import { Controller, useFormContext } from "react-hook-form";

import { GENDERS } from "@/utils/genders";

const HELP = "Shown on your profile unless you prefer not to say. Only support can change it later.";

const RHFGenderPicker = ({ name }) => {
  const { control } = useFormContext();

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState: { error } }) => (
        <FormControl error={Boolean(error)}>
          <FormLabel id={`${name}-label`} sx={{ fontSize: 14, fontWeight: 600, color: "text.secondary" }}>
            Gender
          </FormLabel>
          <RadioGroup row aria-labelledby={`${name}-label`} {...field}>
            {GENDERS.map(({ value, label }) => (
              <FormControlLabel key={value} value={value} control={<Radio />} label={label} />
            ))}
          </RadioGroup>
          <FormHelperText>{error?.message ?? HELP}</FormHelperText>
        </FormControl>
      )}
    />
  );
};

export default RHFGenderPicker;
