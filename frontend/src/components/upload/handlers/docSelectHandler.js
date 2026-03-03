import { store } from "@/redux/store";
import { addFiles } from "@/redux/slices/chatSlice";
import { ShowSnackbar } from "@/redux/slices/userSlice";

export const docSelectHandler = () => {
  const { dispatch } = store;

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
              type: file.name.split(".").pop().toUpperCase(),
              actionType: "doc",
              file: file,
            })
          );
        };
      }
    });
  });
};
