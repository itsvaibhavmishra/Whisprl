import { Box, Typography } from "@mui/material";

const DashboardPage = ({ title, description, maxWidth, children }) => (
  <Box
    component="main"
    sx={{
      flexGrow: 1,
      minWidth: 0,
      height: { xs: "calc(100vh - 65px)", md: "100vh" },
      overflowY: "auto",
    }}
  >
    <Box sx={{ maxWidth, mx: "auto", px: { xs: 2.5, sm: 4, md: 6 }, py: { xs: 4, md: 6 } }}>
      <Typography
        component="h1"
        sx={{ m: 0, fontSize: { xs: 28, md: 36 }, fontWeight: 700, lineHeight: 1.2, letterSpacing: "-0.02em" }}
      >
        {title}
      </Typography>
      {description && (
        <Typography sx={{ mt: 1, color: "text.secondary", maxWidth: "60ch", textWrap: "pretty" }}>
          {description}
        </Typography>
      )}
      <Box sx={{ mt: { xs: 4, md: 5 } }}>{children}</Box>
    </Box>
  </Box>
);

export default DashboardPage;
