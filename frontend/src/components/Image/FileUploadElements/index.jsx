import { Box } from "@mui/material";
import FileHeader from "./FileHeader";

const FileUploadCont = () => {
  return (
    <Box>
      <FileHeader />
      <div>File Body</div>
      <div>File Footer</div>
    </Box>
  );
};
export default FileUploadCont;
