import PropTypes from "prop-types";
import { ThemeProvider, createTheme, useTheme } from "@mui/material/styles";
import useLocales from "@/hooks/useLocales";

ThemeLocalization.propTypes = {
  children: PropTypes.node.isRequired,
};

export default function ThemeLocalization({ children }) {
  const defaultTheme = useTheme();

  const { currentLang } = useLocales();

  const theme = createTheme(defaultTheme, currentLang.systemValue);

  return <ThemeProvider theme={theme}>{children}</ThemeProvider>;
}
