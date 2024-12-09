import { addFiles } from "../../redux/slices/chatSlice";
import { ShowSnackbar } from "../../redux/slices/userSlice";

const UploadImage = () => {
  return <div>UploadImage</div>;
};
export default UploadImage;

// ----------------- other functions -----------------
export const imageSelectHandler = (dispatch) => {
  const acceptedFileTypes = [
    "image/png",
    "image/jpeg",
    "image/gif",
    "image/webp",
  ];

  const fileInput = document.createElement("input");
  fileInput.type = "file";
  fileInput.accept = acceptedFileTypes.join(",");
  fileInput.multiple = true;
  fileInput.click();

  // handling selected file
  fileInput.addEventListener("change", (e) => {
    let selectedFiles = Array.from(e.target.files);

    selectedFiles.forEach((img) => {
      if (!acceptedFileTypes.includes(img.type)) {
        dispatch(
          ShowSnackbar({
            severity: "info",
            message: "Some selected file types are not allowed",
          })
        );

        // filtering out invalid type images
        selectedFiles = selectedFiles.filter((item) => item.name !== img.name);
        return;
      } else if (img.size > 1024 * 1024 * 5) {
        dispatch(
          ShowSnackbar({
            severity: "info",
            message: "Images size should not exceed 5mb",
          })
        );
        console.log(img.name);

        // filtering out invalid size images
        selectedFiles = selectedFiles.filter((item) => item.name !== img.name);
        return;
      } else {
        // converting file to base64
        const reader = new FileReader();
        reader.readAsDataURL(img);

        reader.onload = (e) => {
          // adding file data to redux
          dispatch(
            addFiles({
              fileName: img.name,
              type: "image",
              base64File: e.target.result,
            })
          );
        };
      }
    });
  });
};
