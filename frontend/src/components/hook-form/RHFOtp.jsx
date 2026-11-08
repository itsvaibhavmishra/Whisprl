import { useRef } from "react";
import { Stack, TextField } from "@mui/material";
import { Controller, useFormContext } from "react-hook-form";

export default function RHFOtp({ keyName = "", helperText, inputs = [], ...other }) {
  const { control, setValue } = useFormContext();
  const boxes = useRef([]);

  const nameAt = (position) => `${keyName}${position + 1}`;

  // a pasted, autofilled or keyboard-suggested code arrives whole in one box, so it is spread from the first box when complete
  const fill = (position, typed) => {
    const digits = typed.replace(/\D/g, "");
    if (!digits) {
      setValue(nameAt(position), "", { shouldValidate: true });
      boxes.current[position - 1]?.focus();
      return;
    }
    const start = digits.length >= inputs.length ? 0 : position;
    [...digits].slice(0, inputs.length - start).forEach((digit, offset) => setValue(nameAt(start + offset), digit, { shouldValidate: true }));
    boxes.current[Math.min(start + digits.length, inputs.length - 1)]?.focus();
  };

  return (
    <Stack direction="row" spacing={{ xs: 1, sm: 2 }} sx={{ justifyContent: "center" }}>
      {inputs.map((name, position) => (
        <Controller
          key={name}
          name={nameAt(position)}
          control={control}
          render={({ field, fieldState: { error } }) => (
            <TextField
              {...field}
              inputRef={(box) => {
                field.ref(box);
                boxes.current[position] = box;
              }}
              onChange={(event) => fill(position, event.target.value)}
              onFocus={(event) => event.currentTarget.select()}
              error={Boolean(error)}
              autoFocus={position === 0}
              placeholder="-"
              slotProps={{
                htmlInput: {
                  inputMode: "numeric",
                  autoComplete: position === 0 ? "one-time-code" : "off",
                  "aria-label": `Digit ${position + 1} of ${inputs.length}`,
                  sx: { textAlign: "center" },
                },
              }}
              helperText={error ? error.message : helperText}
              {...other}
            />
          )}
        />
      ))}
    </Stack>
  );
}
