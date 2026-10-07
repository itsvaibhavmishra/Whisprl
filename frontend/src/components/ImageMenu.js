import { useRef, useState } from "react";
import { Button, IconButton, ListItemIcon, Menu, MenuItem, Tooltip } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { Camera, Trash, UploadSimple } from "phosphor-react";

import ImageCropper from "@/components/image-cropper/ImageCropper";
import { notify } from "@/utils/notify";

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];

const KINDS = {
  photo: { noun: "photo", crop: { title: "Crop your photo", aspect: 1, round: true, maxWidth: 512 } },
  cover: { noun: "cover", crop: { title: "Crop your cover", aspect: 3, round: false, maxWidth: 1500 } },
  group: { noun: "group photo", crop: { title: "Crop the group photo", aspect: 1, round: true, maxWidth: 512 } },
};

const glass = (theme) => ({
  bgcolor: alpha(theme.palette.background.paper, 0.85),
  backdropFilter: "blur(6px)",
  "&:hover": { bgcolor: theme.palette.background.paper },
});

const ImageMenu = ({ kind, hasImage, onChange }) => {
  const { noun, crop } = KINDS[kind];
  const fileInput = useRef(null);
  const [anchor, setAnchor] = useState(null);
  const [imageToCrop, setImageToCrop] = useState(null);

  const pickFile = () => {
    setAnchor(null);
    fileInput.current.click();
  };

  const openMenu = (event) => (hasImage ? setAnchor(event.currentTarget) : pickFile());

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

  const label = hasImage ? `Change ${noun}` : `Add a ${noun}`;

  return (
    <>
      {kind !== "cover" ? (
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
      ) : (
        <Button color="inherit" startIcon={<Camera />} onClick={openMenu} sx={glass}>
          {label}
        </Button>
      )}

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

      <input ref={fileInput} type="file" accept={ACCEPTED_TYPES.join(",")} hidden onChange={choose} />
      {imageToCrop && <ImageCropper image={imageToCrop} {...crop} onCancel={() => closeCropper()} onCrop={closeCropper} />}
    </>
  );
};

export default ImageMenu;
