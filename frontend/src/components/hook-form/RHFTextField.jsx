import { TextField } from "@mui/material";
import { useFormContext, Controller } from "react-hook-form";

export default function RHFTextField({ name, helperText, ...other }) {
  const { control } = useFormContext();

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState: { error } }) => (
        <TextField
          sx={{ mt: 1 }}
          {...field}
          fullWidth
          value={typeof field.value === "number" && field.value === 0 ? "" : field.value}
          error={!!error}
          helperText={error ? error.message : helperText}
          {...other}
        />
      )}
    />
  );
}
