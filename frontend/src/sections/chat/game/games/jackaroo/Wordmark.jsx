import { Box } from "@mui/material";

import art from "@/sections/chat/game/games/jackaroo/art";

// the gold lettering the design puts in the bar during play, lighter than the sign it replaces there
const Wordmark = ({ width }) => <Box component="img" src={art.wordmark} alt="Jackaroo" sx={{ display: "block", width, maxWidth: "100%" }} />;

export default Wordmark;
