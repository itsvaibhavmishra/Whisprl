import { Box, Stack, Typography } from "@mui/material";
import { CheckCircle, Circle } from "phosphor-react";
import { useWatch } from "react-hook-form";

import { PASSWORD_RULES } from "@/utils/formRules";

const PasswordChecklist = ({ name }) => {
  const password = useWatch({ name }) || "";

  return (
    <Box
      component="ul"
      aria-label="Password requirements"
      sx={{ listStyle: "none", m: 0, p: 0, display: "grid", gridTemplateColumns: { sm: "repeat(2, 1fr)" }, rowGap: 0.75, columnGap: 2 }}
    >
      {PASSWORD_RULES.map(({ label, isMet }) => {
        const met = isMet(password);
        return (
          <Stack component="li" key={label} direction="row" spacing={1} alignItems="center" sx={{ color: met ? "success.main" : "text.secondary" }}>
            {met ? <CheckCircle size={16} weight="fill" aria-hidden="true" /> : <Circle size={16} aria-hidden="true" />}
            <Typography variant="body2" component="span" sx={{ fontWeight: 400 }}>
              {label}
              <Box component="span" sx={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0 0 0 0)" }}>
                {met ? ", done" : ", not yet"}
              </Box>
            </Typography>
          </Stack>
        );
      })}
    </Box>
  );
};

export default PasswordChecklist;
