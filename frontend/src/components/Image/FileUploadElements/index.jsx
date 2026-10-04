import { Stack, IconButton, useTheme } from "@mui/material";
import { X } from "phosphor-react";
import { useDispatch } from "react-redux";
import FileHeader from "./FileHeader";
import FileBody from "./FileBody";
import FileFooter from "./FileFooter";
import { clearFiles } from "@/redux/slices/chatSlice";

const FileUploadCont = ({ convo_id }) => {
  const theme = useTheme();
  const dispatch = useDispatch();

  return (
    <Stack
      sx={{
        flex: 1,
        backgroundColor: theme.palette.background.paper,
        overflow: "hidden",
        position: "relative",
      }}
    >
      {/* Top-right close button */}
      <IconButton
        onClick={() => dispatch(clearFiles())}
        size="small"
        sx={{
          position: "absolute",
          top: 8,
          right: 8,
          zIndex: 10,
          backgroundColor: theme.palette.background.default,
          "&:hover": { backgroundColor: theme.palette.action.hover },
        }}
      >
        <X size={18} />
      </IconButton>

      <FileHeader />
      <FileBody />
      <FileFooter convo_id={convo_id} />
    </Stack>
  );
};
export default FileUploadCont;
