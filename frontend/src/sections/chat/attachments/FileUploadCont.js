import { IconButton, Stack, Tooltip, Typography } from "@mui/material";
import { X } from "phosphor-react";
import { useDispatch, useSelector } from "react-redux";

import { ClearAttachments } from "@/redux/slices/actions/attachmentActions";
import FileBody from "@/sections/chat/attachments/FileBody";
import FileFooter from "@/sections/chat/attachments/FileFooter";

const FileUploadCont = () => {
  const dispatch = useDispatch();
  const count = useSelector((state) => state.chat.files.length);

  return (
    <Stack sx={{ flex: 1, minHeight: 0 }}>
      <Stack direction="row" alignItems="center" spacing={1} sx={{ px: { xs: 1, md: 2 }, py: 1 }}>
        <Tooltip title="Discard">
          <IconButton aria-label="Discard attachments" onClick={() => dispatch(ClearAttachments())} sx={{ bgcolor: "chat.pill", "&:hover": { bgcolor: "chat.raised" } }}>
            <X size={20} weight="bold" />
          </IconButton>
        </Tooltip>
        <Typography sx={{ px: 1.5, py: 0.5, borderRadius: 99, fontSize: 13, fontWeight: 700, bgcolor: "chat.pill" }}>
          {count === 1 ? "1 file ready to send" : `${count} files ready to send`}
        </Typography>
      </Stack>
      <FileBody />
      <FileFooter />
    </Stack>
  );
};

export default FileUploadCont;
