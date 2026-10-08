import { useRef, useState } from "react";
import { IconButton, ListItemIcon, Menu, MenuItem, Tooltip } from "@mui/material";
import { Camera, Trash, UploadSimple } from "phosphor-react";

import ImageCropper from "@/components/image-cropper/ImageCropper";
import { notify } from "@/utils/notify";

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];

const KINDS = {
  photo: { noun: "photo", crop: { title: "Crop your photo", aspect: 1, round: true, maxWidth: 512 } },
  cover: { noun: "cover", crop: { title: "Crop your cover", aspect: 3, round: false, maxWidth: 1500 } },
  group: { noun: "group photo", crop: { title: "Crop the group photo", aspect: 1, round: true, maxWidth: 512 } },
};

// the returned picker holds the hidden file input and the cropper, so it has to be rendered once
export const useCroppedImage = (kind, onChange) => {
  const fileInput = useRef(null);
  const [imageToCrop, setImageToCrop] = useState(null);

  const choose = (event) => {
    const [file] = event.target.files;
    event.target.value = "";
    if (!file) return;
    if (!ACCEPTED_TYPES.includes(file.type)) {
      notify({ severity: "error", message: "Choose a JPG, PNG or WebP image" });
      return;
    }
    setImageToCrop(URL.createObjectURL(file));
  };

  const closeCropper = (cropped) => {
    URL.revokeObjectURL(imageToCrop);
    setImageToCrop(null);
    if (cropped) onChange(cropped);
  };

  const picker = (
    <>
      <input ref={fileInput} type="file" accept={ACCEPTED_TYPES.join(",")} hidden onChange={choose} />
      {imageToCrop && <ImageCropper image={imageToCrop} {...KINDS[kind].crop} onCancel={() => closeCropper()} onCrop={closeCropper} />}
    </>
  );

  return { pick: () => fileInput.current.click(), picker };
};

const ImageMenu = ({ kind, hasImage, onChange }) => {
  const { noun } = KINDS[kind];
  const { pick, picker } = useCroppedImage(kind, onChange);
  const [anchor, setAnchor] = useState(null);

  const pickFile = () => {
    setAnchor(null);
    pick();
  };

  const openMenu = (event) => (hasImage ? setAnchor(event.currentTarget) : pickFile());

  const label = hasImage ? `Change ${noun}` : `Add a ${noun}`;

  return (
    <>
      <Tooltip title={label}>
        <IconButton
          aria-label={label}
          onClick={openMenu}
          sx={{
            width: 40,
            height: 40,
            bgcolor: "background.paper",
            color: "text.primary",
            border: 2,
            borderColor: "background.default",
            boxShadow: (theme) => theme.customShadows?.z8,
            "&:hover": { bgcolor: "background.neutral" },
          }}
        >
          <Camera size={20} weight="bold" />
        </IconButton>
      </Tooltip>

      <Menu anchorEl={anchor} open={!!anchor} onClose={() => setAnchor(null)}>
        <MenuItem onClick={pickFile}>
          <ListItemIcon>
            <UploadSimple size={18} />
          </ListItemIcon>
          Upload a new {noun}
        </MenuItem>
        <MenuItem
          onClick={() => {
            setAnchor(null);
            onChange("");
          }}
          sx={{ color: "error.main" }}
        >
          <ListItemIcon sx={{ color: "inherit" }}>
            <Trash size={18} />
          </ListItemIcon>
          Remove {noun}
        </MenuItem>
      </Menu>

      {picker}
    </>
  );
};

export default ImageMenu;
