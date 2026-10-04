import { store } from "@/redux/store";
import { addFiles } from "@/redux/slices/chatSlice";
import { ShowSnackbar } from "@/redux/slices/userSlice";

const MAX_FILES = 5;

export const docSelectHandler = () => {
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

  const fileInput = document.createElement("input");
  fileInput.type = "file";
  fileInput.multiple = true;
  fileInput.click();

  // handling selected file
  fileInput.addEventListener("change", (e) => {
    let selectedFiles = Array.from(e.target.files);

    selectedFiles.forEach((file) => {
      if (file.size > 1024 * 1024 * 5) {
        dispatch(
          ShowSnackbar({
            severity: "info",
            message: "Files size should not exceed 5mb",
          })
        );

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
        // converting file to base64
        const reader = new FileReader();
        reader.readAsDataURL(file);

        reader.onload = (readerEvent) => {
          dispatch(
            addFiles({
              fileName: file.name,
              type: file.name.split(".").pop().toUpperCase(),
              actionType: "doc",
              file: file,
              dataUrl: readerEvent.target.result,
            })
          );
        };
      }
    });
  });
};
