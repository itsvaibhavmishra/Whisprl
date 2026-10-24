import { Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import dayjs from "dayjs";

const LOOKS = {
  banned: { label: "Banned", color: "error" },
  suspended: { label: "Suspended", color: "warning" },
  admin: { label: "Admin", color: "primary" },
  owner: { label: "Owner", color: "primary" },
};

export const statusOf = (person) => {
  if (person.bannedAt) return "banned";
  if (person.suspendedUntil && dayjs(person.suspendedUntil).isAfter(dayjs())) return "suspended";
  return person.role === "owner" || person.role === "admin" ? person.role : null;
};

const suspensionEndsOn = (person) => dayjs(person.suspendedUntil).format("D MMM YYYY");

const PersonStatus = ({ person }) => {
  const status = statusOf(person);
  if (!status) return null;

  const { label, color } = LOOKS[status];
  return (
    <Typography
      component="span"
      sx={{
        px: 1,
        py: 0.25,
        borderRadius: 99,
        fontSize: 12,
        fontWeight: 800,
        whiteSpace: "nowrap",
        color: `${color}.main`,
        bgcolor: (theme) => alpha(theme.palette[color].main, 0.14),
      }}
    >
      {status === "suspended" ? `${label} to ${suspensionEndsOn(person)}` : label}
    </Typography>
  );
};

export default PersonStatus;
