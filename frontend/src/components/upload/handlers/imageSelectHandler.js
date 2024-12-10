import { addFiles } from "src/redux/slices/chatSlice";
import { ShowSnackbar } from "src/redux/slices/userSlice";
import { store } from "src/redux/store";

export const imageSelectHandler = () => {
  const { dispatch } = store;

  const acceptedFileTypes = [
    "image/png",
    "image/jpeg",
    "image/gif",
    "image/webp",
    "video/mp4",
    "video/mpeg",
    "video/webm",
    "video/webp",
  ];

  const fileInput = document.createElement("input");
  fileInput.type = "file";
  fileInput.accept = acceptedFileTypes.join(",");
  fileInput.multiple = true;
  fileInput.click();

  // handling selected file
  fileInput.addEventListener("change", (e) => {
    let selectedFiles = Array.from(e.target.files);

    selectedFiles.forEach((file) => {
      if (!acceptedFileTypes.includes(file.type)) {
        dispatch(
          ShowSnackbar({
            severity: "warning",
            message: `File type ${file.type} is not allowed`,
            description: `Allowed types: ${acceptedFileTypes.join(", ")}`,
          })
        );

        // filtering out invalid type images
        selectedFiles = selectedFiles.filter((item) => item.name !== file.name);
        return;
      } else if (file.size > 1024 * 1024 * 5) {
        dispatch(
          ShowSnackbar({
            severity: "warning",
            message: "Images size should not exceed 5mb",
          })
        );

        // filtering out invalid size images
        selectedFiles = selectedFiles.filter((item) => item.name !== file.name);
        return;
      } else {
        // converting file to base64
        const reader = new FileReader();
        reader.readAsDataURL(file);

        reader.onload = (e) => {
          // adding file data to redux
          dispatch(
            addFiles({
              fileName: file.name,
              type: file.type?.split("/")[0],
              base64File: e.target.result,
            })
          );
        };
      }
    });
  });
};
