import { alpha, styled } from "@mui/material";

// styles for search bar
const Search = styled("div")(({ theme }) => ({
  position: "relative",
  borderRadius: 20,
  backgroundColor: alpha(
    theme.palette.mode === "light" ? "#F0F4FF" : "#293445",
    1
  ),
  marginRight: theme.spacing(2),
  marginLeft: 0,
  width: "100%",
  "& .MuiInputBase-root": {
    width: "100%",
  },
}));

export default Search;
