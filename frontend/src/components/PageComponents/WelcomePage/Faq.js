import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Typography,
} from "@mui/material";
import { CaretDown } from "phosphor-react";
import { Helmet } from "react-helmet-async";

import { FAQS } from "@/components/PageComponents/WelcomePage/content";
import {
  sectionHeading,
  sectionIntro,
  sectionSpacing,
} from "@/components/PageComponents/WelcomePage/styles";

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQS.map(({ question, answer }) => ({
    "@type": "Question",
    name: question,
    acceptedAnswer: { "@type": "Answer", text: answer },
  })),
};

const Faq = () => (
  <Box
    component="section"
    aria-labelledby="faq-title"
    sx={{
      ...sectionSpacing,
      display: "grid",
      gridTemplateColumns: { md: "5fr 7fr" },
      columnGap: 8,
      rowGap: 4,
      alignItems: "start",
    }}
  >
    <Helmet>
      <script type="application/ld+json">{JSON.stringify(faqSchema)}</script>
    </Helmet>

    <Box sx={{ position: { md: "sticky" }, top: { md: 32 } }}>
      <Typography id="faq-title" component="h2" sx={sectionHeading}>
        Frequently asked questions
      </Typography>
      <Typography sx={sectionIntro}>
        The short answers to what people ask before they sign up.
      </Typography>
    </Box>

    <Box sx={{ borderTop: 1, borderColor: "divider" }}>
      {FAQS.map(({ question, answer }) => (
        <Accordion
          key={question}
          disableGutters
          elevation={0}
          square
          sx={{
            bgcolor: "transparent",
            borderBottom: 1,
            borderColor: "divider",
            "&::before": { display: "none" },
            "&.Mui-expanded": { boxShadow: "none" },
          }}
        >
          <AccordionSummary
            expandIcon={<CaretDown size={20} />}
            sx={{ px: 0, minHeight: 0, "& .MuiAccordionSummary-content": { my: 2 } }}
          >
            <Typography component="h3" sx={{ fontSize: 17, fontWeight: 600 }}>
              {question}
            </Typography>
          </AccordionSummary>
          <AccordionDetails sx={{ px: 0, pt: 0, pb: 2.5 }}>
            <Typography sx={{ color: "text.secondary", lineHeight: 1.7, maxWidth: "62ch" }}>
              {answer}
            </Typography>
          </AccordionDetails>
        </Accordion>
      ))}
    </Box>
  </Box>
);

export default Faq;
