import { Stack, IconButton, useTheme } from "@mui/material";
import { X } from "phosphor-react";
import { useDispatch } from "react-redux";
import FileHeader from "@/sections/chat/attachments/FileHeader";
import FileBody from "@/sections/chat/attachments/FileBody";
import FileFooter from "@/sections/chat/attachments/FileFooter";
import { ClearAttachments } from "@/redux/slices/actions/attachmentActions";

const FileUploadCont = () => {
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
        onClick={() => dispatch(ClearAttachments())}
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
      <FileFooter />
    </Stack>
  );
};
export default FileUploadCont;
