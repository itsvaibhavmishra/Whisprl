import { Box, Button, Container, IconButton, Link, Stack, Typography } from "@mui/material";
import { GithubLogo, InstagramLogo, LinkedinLogo } from "phosphor-react";
import { Link as RouterLink } from "react-router-dom";

import whisprlMark from "@/assets/icons/logo/WhisprlMark.webp";
import AppearanceMenu from "@/components/AppearanceMenu";
import { PORTFOLIO_URL, SOURCE_URL } from "@/config";
import { PATH_AUTH, PATH_DOCS } from "@/routes/paths";

const SOCIALS = [
  { label: "Vaibhaw Mishra on GitHub", href: "https://github.com/itsvaibhavmishra", Icon: GithubLogo },
  { label: "Vaibhaw Mishra on Instagram", href: "https://instagram.com/itsvaibhavmishra", Icon: InstagramLogo },
  { label: "Vaibhaw Mishra on LinkedIn", href: "https://www.linkedin.com/in/itsvaibhavmishra", Icon: LinkedinLogo },
];

const SiteHeader = () => (
  <Stack
    component="header"
    direction="row"
    alignItems="center"
    justifyContent="space-between"
    sx={{ py: { xs: 2, md: 3 } }}
  >
    <Box component={RouterLink} to={PATH_AUTH.general.welcome} sx={{ display: "flex" }}>
      <Box
        component="img"
        src={whisprlMark}
        alt="Whisprl home"
        width={48}
        height={52}
      />
    </Box>
    <Stack component="nav" aria-label="Account" direction="row" spacing={1} alignItems="center">
      <Button component={RouterLink} to={PATH_AUTH.general.login} color="inherit">
        Log in
      </Button>
      <Button component={RouterLink} to={PATH_AUTH.general.register} variant="contained">
        Create account
      </Button>
      <AppearanceMenu />
    </Stack>
  </Stack>
);

const SiteFooter = () => (
  <Stack
    component="footer"
    direction={{ xs: "column", md: "row" }}
    spacing={3}
    justifyContent="space-between"
    alignItems={{ md: "center" }}
    sx={{ mt: { xs: 6, md: 8 }, py: 4, borderTop: 1, borderColor: "divider" }}
  >
    <Typography variant="body2" color="text.secondary">
      © {new Date().getFullYear()} Whisprl. Built by{" "}
      <Link href={PORTFOLIO_URL} target="_blank" rel="noopener" color="text.primary">
        Vaibhaw Mishra
      </Link>
      .
    </Typography>
    <Stack direction="row" spacing={3} alignItems="center" flexWrap="wrap" useFlexGap>
      <Link component={RouterLink} to={PATH_DOCS.general.tnc} color="text.secondary" variant="body2">
        Terms and conditions
      </Link>
      <Link href={SOURCE_URL} target="_blank" rel="noopener" color="text.secondary" variant="body2">
        Source on GitHub
      </Link>
      <Stack direction="row">
        {SOCIALS.map(({ label, href, Icon }) => (
          <IconButton
            key={href}
            component="a"
            href={href}
            target="_blank"
            rel="noopener"
            aria-label={label}
            sx={{ color: "text.secondary" }}
          >
            <Icon size={20} weight="duotone" />
          </IconButton>
        ))}
      </Stack>
    </Stack>
  </Stack>
);

const SitePage = ({ children }) => (
  <Container maxWidth="xl">
    <Box sx={{ maxWidth: 1200, mx: "auto" }}>
      <SiteHeader />
      <Box component="main">{children}</Box>
      <SiteFooter />
    </Box>
  </Container>
);

export default SitePage;
