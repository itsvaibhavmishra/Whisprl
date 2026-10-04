import { Box, Link, Stack, Typography } from "@mui/material";

import { INTRO, LAST_UPDATED, SECTIONS } from "@/components/PageComponents/TermsPage/sections";

const prose = { color: "text.secondary", lineHeight: 1.75, maxWidth: "68ch", textWrap: "pretty" };

const Parts = ({ parts }) =>
  parts.map((part, position) =>
    typeof part === "string" ? (
      part
    ) : (
      <Link key={position} href={part.href} target="_blank" rel="noopener">
        {part.label}
      </Link>
    )
  );

const Block = ({ block }) => {
  if (typeof block === "string") {
    return <Typography sx={prose}>{block}</Typography>;
  }
  if (block.list) {
    return (
      <Box component="ul" sx={{ ...prose, m: 0, pl: 3, "& li + li": { mt: 1 } }}>
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

const TnC = () => (
  <Box sx={{ py: { xs: 4, md: 8 } }}>
    <Typography
      component="h1"
      sx={{ m: 0, fontSize: { xs: 36, md: 56 }, fontWeight: 700, lineHeight: 1.05, letterSpacing: "-0.03em" }}
    >
      Terms and conditions
    </Typography>
    <Typography sx={{ mt: 2, color: "text.secondary" }}>Last updated {LAST_UPDATED}</Typography>
    <Typography sx={{ mt: 3, fontSize: { xs: 17, md: 19 }, lineHeight: 1.6, maxWidth: "62ch", textWrap: "pretty" }}>
      <Parts parts={INTRO.parts} />
    </Typography>

    <Box
      sx={{
        mt: { xs: 5, md: 8 },
        display: "grid",
        gridTemplateColumns: { md: "3fr 9fr" },
        columnGap: 8,
        alignItems: "start",
      }}
    >
      <Box
        component="nav"
        aria-label="Contents"
        sx={{ display: { xs: "none", md: "block" }, position: "sticky", top: 32 }}
      >
        <Typography sx={{ mb: 2, fontWeight: 700 }}>Contents</Typography>
        <Stack component="ol" spacing={1.25} sx={{ listStyle: "none", p: 0, m: 0 }}>
          {SECTIONS.map(({ id, title }) => (
            <li key={id}>
              <Link href={`#${id}`} color="text.secondary" underline="hover" variant="body2">
                {title}
              </Link>
            </li>
          ))}
        </Stack>
      </Box>

      <Stack spacing={{ xs: 5, md: 6 }}>
        {SECTIONS.map(({ id, title, blocks }) => (
          <Box
            component="section"
            key={id}
            id={id}
            aria-labelledby={`${id}-title`}
            sx={{ scrollMarginTop: 24 }}
          >
            <Typography
              id={`${id}-title`}
              component="h2"
              sx={{ m: 0, fontSize: { xs: 22, md: 24 }, fontWeight: 700, letterSpacing: "-0.01em" }}
            >
              {title}
            </Typography>
            <Stack spacing={2} sx={{ mt: 2 }}>
              {blocks.map((block, position) => (
                <Block key={position} block={block} />
              ))}
            </Stack>
          </Box>
        ))}
      </Stack>
    </Box>
  </Box>
);

export default TnC;
