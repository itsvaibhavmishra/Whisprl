import { useMemo } from "react";
import { Box, ButtonBase, Stack, Typography } from "@mui/material";

import { drawCovering } from "@/utils/media-editor/draw";
import { PHOTO_FILTERS, applyMatrix, filterNamed } from "@/utils/media-editor/filters";

const THUMBNAIL = 112;

const thumbnailsOf = (image) =>
  PHOTO_FILTERS.map((filter) => {
    const canvas = Object.assign(document.createElement("canvas"), { width: THUMBNAIL, height: THUMBNAIL });
    const context = canvas.getContext("2d");
    drawCovering(context, image, THUMBNAIL, THUMBNAIL);
    if (filter.matrix) applyMatrix(context, filter.matrix);
    return canvas.toDataURL("image/jpeg", 0.8);
  });

const FilterStrip = ({ image, chosen, onChoose }) => {
  const thumbnails = useMemo(() => (image ? thumbnailsOf(image) : []), [image]);
  const current = filterNamed(chosen);

  return (
    <Stack direction="row" spacing={1.25} sx={{ px: 2, py: 1.25, overflowX: "auto" }}>
      {PHOTO_FILTERS.map((filter, index) => (
        <ButtonBase
          key={filter.name}
          aria-label={filter.name}
          aria-pressed={filter === current}
          onClick={() => onChoose(filter)}
          sx={{ flexShrink: 0, flexDirection: "column", gap: 0.75, borderRadius: 2, p: 0.5 }}
        >
          <Box
            component="img"
            src={thumbnails[index]}
            alt=""
            sx={{ width: 56, height: 56, borderRadius: 1.5, bgcolor: "rgba(255, 255, 255, 0.12)", outline: filter === current ? "2px solid #fff" : "none", outlineOffset: 2 }}
          />
          <Typography sx={{ fontSize: 11, fontWeight: filter === current ? 800 : 600, whiteSpace: "nowrap" }}>{filter.name}</Typography>
        </ButtonBase>
      ))}
    </Stack>
  );
};

export default FilterStrip;
