import { store } from "@/redux/store";
import { addFiles } from "@/redux/slices/chatSlice";
import { ShowSnackbar } from "@/redux/slices/userSlice";

const MAX_FILES = 5;

export const imageSelectHandler = () => {
  const { dispatch, getState } = store;
  const currentFiles = getState().chat.files;

  if (currentFiles.length >= MAX_FILES) {
    dispatch(
      ShowSnackbar({
        severity: "info",
        message: `Maximum ${MAX_FILES} files allowed per message`,
      })
    );
    return;
  }

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
            severity: "info",
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
            severity: "info",
            message: "Files size should not exceed 5mb",
          })
        );

        // filtering out invalid size images
        selectedFiles = selectedFiles.filter((item) => item.name !== file.name);
        return;
      } else if (getState().chat.files.length >= MAX_FILES) {
        dispatch(
          ShowSnackbar({
            severity: "info",
            message: `Maximum ${MAX_FILES} files allowed per message`,
          })
        );
        return;
      } else {
        // converting file to base64 for preview
        const reader = new FileReader();
        reader.readAsDataURL(file);

        reader.onload = (readerEvent) => {
          // adding file data to redux
          dispatch(
            addFiles({
              fileName: file.name,
              type: file.type?.split("/")[0].toUpperCase(),
              actionType: "image",
              file: file,
              dataUrl: readerEvent.target.result,
            })
          );
        };
      }
    });
  });
};
