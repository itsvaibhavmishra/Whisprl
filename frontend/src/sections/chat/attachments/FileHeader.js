import { IconButton, Stack } from "@mui/material";
import { XCircle } from "phosphor-react";
import { useDispatch } from "react-redux";
import { ClearAttachments } from "@/redux/slices/actions/attachmentActions";

const FileHeader = () => {
  const dispatch = useDispatch();
  return (
    <Stack direction="row" justifyContent="flex-start" alignItems="center">
      <IconButton
        onClick={() => {
          dispatch(ClearAttachments());
        }}
      >
        <XCircle />
      </IconButton>
    </Stack>
  );
};
export default FileHeader;
