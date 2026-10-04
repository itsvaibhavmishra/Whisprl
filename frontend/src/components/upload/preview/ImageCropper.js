import { useState } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Slider,
  Stack,
  Tooltip,
} from "@mui/material";
import { ArrowClockwise, MagnifyingGlassMinus, MagnifyingGlassPlus } from "phosphor-react";
import Cropper from "react-easy-crop";

import cropImage from "@/components/upload/preview/cropImage";

const ImageCropper = ({ image, title, aspect, round, maxWidth, onCancel, onCrop }) => {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [cropArea, setCropArea] = useState(null);

  const applyCrop = async () => onCrop(await cropImage(image, cropArea, rotation, maxWidth));

  return (
    <Dialog open onClose={onCancel} fullWidth maxWidth={round ? "xs" : "sm"} aria-labelledby="crop-title">
      <DialogTitle id="crop-title">{title}</DialogTitle>
      <DialogContent>
        <Box sx={{ position: "relative", height: 320, borderRadius: 2, overflow: "hidden", bgcolor: "grey.900" }}>
          <Cropper
            image={image}
            crop={position}
            zoom={zoom}
            maxZoom={4}
            rotation={rotation}
            aspect={aspect}
            cropShape={round ? "round" : "rect"}
            showGrid={false}
            onCropChange={setPosition}
            onZoomChange={setZoom}
            onRotationChange={setRotation}
            onCropComplete={(_, pixels) => setCropArea(pixels)}
          />
        </Box>
        <Stack direction="row" spacing={2} alignItems="center" sx={{ mt: 3 }}>
          <MagnifyingGlassMinus size={20} aria-hidden="true" />
          <Slider
            value={zoom}
            min={1}
            max={4}
            step={0.05}
            aria-label="Zoom"
            onChange={(_, value) => setZoom(value)}
          />
          <MagnifyingGlassPlus size={20} aria-hidden="true" />
          <Tooltip title="Rotate">
            <IconButton aria-label="Rotate a quarter turn" onClick={() => setRotation((rotation + 90) % 360)}>
              <ArrowClockwise size={20} />
            </IconButton>
          </Tooltip>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button color="inherit" onClick={onCancel}>
          Cancel
        </Button>
        <Button variant="contained" onClick={applyCrop} disabled={!cropArea}>
          Use photo
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ImageCropper;
