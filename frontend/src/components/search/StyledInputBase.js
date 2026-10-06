import { InputBase, styled } from "@mui/material";

// implementation of search functionality
const StyledInputBase = styled(InputBase)(({ theme }) => ({
  color: "inherit",
  "& .MuiInputBase-input": {
    width: "100%",
    padding: theme.spacing(1, 1, 1, 0),
    paddingLeft: `calc(1em + ${theme.spacing(4)})`,
    [theme.breakpoints.down("md")]: {
      width: "calc(100vw - 8em)",
    },
  },
}));

export default StyledInputBase;
