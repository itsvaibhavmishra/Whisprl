import { Box, Link, Stack, Typography } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";

const prose = { color: "text.secondary", lineHeight: 1.75, maxWidth: "68ch", textWrap: "pretty" };

const linkProps = ({ to, email, href }) => {
  if (to) return { component: RouterLink, to };
  if (email) return { href: `mailto:${email}` };
  return { href, target: "_blank", rel: "noopener" };
};

const Parts = ({ parts }) =>
  parts.map((part, position) =>
    typeof part === "string" ? (
      part
    ) : (
      <Link key={position} {...linkProps(part)}>
        {part.label ?? part.email}
      </Link>
    )
  );

const Block = ({ block }) => {
  if (typeof block === "string") {
    return <Typography sx={prose}>{block}</Typography>;
  }
  if (block.list) {
    return (
      <Box component={block.ordered ? "ol" : "ul"} sx={{ ...prose, m: 0, pl: 3, "& li + li": { mt: 1 } }}>
        {block.list.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </Box>
    );
  }
  return (
    <Typography sx={prose}>
      <Parts parts={block.parts} />
    </Typography>
  );
};

const Contents = ({ sections }) => (
  <Box component="nav" aria-label="Contents" sx={{ display: { xs: "none", md: "block" }, position: "sticky", top: 32 }}>
    <Typography sx={{ mb: 2, fontWeight: 700 }}>Contents</Typography>
    <Stack component="ol" spacing={1.25} sx={{ listStyle: "none", p: 0, m: 0 }}>
      {sections.map(({ id, title }) => (
        <li key={id}>
          <Link href={`#${id}`} color="text.secondary" underline="hover" variant="body2">
            {title}
          </Link>
        </li>
      ))}
    </Stack>
  </Box>
);

const Section = ({ id, title, blocks }) => (
  <Box component="section" id={id} aria-labelledby={`${id}-title`} sx={{ scrollMarginTop: 24 }}>
    <Typography id={`${id}-title`} component="h2" sx={{ m: 0, fontSize: { xs: 22, md: 24 }, fontWeight: 700, letterSpacing: "-0.01em" }}>
      {title}
    </Typography>
    <Stack spacing={2} sx={{ mt: 2 }}>
      {blocks.map((block, position) => (
        <Block key={position} block={block} />
      ))}
    </Stack>
  </Box>
);

const DocPage = ({ title, lastUpdated, intro, sections }) => (
  <Box sx={{ py: { xs: 4, md: 8 } }}>
    <Typography component="h1" sx={{ m: 0, fontSize: { xs: 36, md: 56 }, fontWeight: 700, lineHeight: 1.05, letterSpacing: "-0.03em" }}>
      {title}
    </Typography>
    <Typography sx={{ mt: 2, color: "text.secondary" }}>Last updated {lastUpdated}</Typography>
    <Typography sx={{ mt: 3, fontSize: { xs: 17, md: 19 }, lineHeight: 1.6, maxWidth: "62ch", textWrap: "pretty" }}>
      <Parts parts={intro} />
    </Typography>

    <Box sx={{ mt: { xs: 5, md: 8 }, display: "grid", gridTemplateColumns: { md: "3fr 9fr" }, columnGap: 8, alignItems: "start" }}>
      <Contents sections={sections} />
      <Stack spacing={{ xs: 5, md: 6 }}>
        {sections.map((section) => (
          <Section key={section.id} {...section} />
        ))}
      </Stack>
    </Box>
  </Box>
);

export default DocPage;
