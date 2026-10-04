import { IconButton, Stack } from "@mui/material";
import { XCircle } from "phosphor-react";
import { useDispatch } from "react-redux";
import { clearFiles } from "@/redux/slices/chatSlice";

const FileHeader = () => {
  const dispatch = useDispatch();
  return (
    <Stack direction="row" justifyContent="flex-start" alignItems="center">
      <IconButton
        onClick={() => {
          dispatch(clearFiles());
        }}
      >
        <XCircle />
      </IconButton>
    </Stack>
  );
};
export default FileHeader;
