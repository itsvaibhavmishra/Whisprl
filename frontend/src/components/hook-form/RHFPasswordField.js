import { useState } from "react";
import { IconButton, InputAdornment } from "@mui/material";
import { Eye, EyeSlash } from "phosphor-react";

import RHFTextField from "@/components/hook-form/RHFTextField";

const RHFPasswordField = (props) => {
  const [visible, setVisible] = useState(false);

  return (
    <RHFTextField
      type={visible ? "text" : "password"}
      InputProps={{
        endAdornment: (
          <InputAdornment position="end">
            <IconButton edge="end" aria-label={visible ? "Hide password" : "Show password"} onClick={() => setVisible(!visible)}>
              {visible ? <EyeSlash size={20} /> : <Eye size={20} />}
            </IconButton>
          </InputAdornment>
        ),
      }}
      {...props}
    />
  );
};

export default RHFPasswordField;
