import { useState } from "react";
import { IconButton, InputAdornment } from "@mui/material";
import { EyeIcon, EyeSlashIcon } from "@phosphor-icons/react";

import RHFTextField from "@/components/hook-form/RHFTextField";

const RHFPasswordField = (props) => {
  const [visible, setVisible] = useState(false);

  return (
    <RHFTextField
      type={visible ? "text" : "password"}
      slotProps={{
        input: {
          endAdornment: (
            <InputAdornment position="end">
              <IconButton edge="end" aria-label={visible ? "Hide password" : "Show password"} onClick={() => setVisible(!visible)}>
                {visible ? <EyeSlashIcon size={20} /> : <EyeIcon size={20} />}
              </IconButton>
            </InputAdornment>
          ),
        },
      }}
      {...props}
    />
  );
};

export default RHFPasswordField;
