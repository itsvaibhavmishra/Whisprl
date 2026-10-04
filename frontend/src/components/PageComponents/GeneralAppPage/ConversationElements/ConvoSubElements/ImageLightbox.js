import { useState, useRef } from "react";
import { Dialog, IconButton, Box, Typography, useTheme, useMediaQuery } from "@mui/material";
import { X, ArrowLeft, ArrowRight } from "phosphor-react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";

const THUMB_SIZE = 56;

const ImageLightbox = ({ open, onClose, images, startIndex = 0 }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const swiperRef = useRef(null);
  const [activeIndex, setActiveIndex] = useState(startIndex);

  // Sync active index when lightbox opens with a new startIndex
  const handleOpen = () => {
    setActiveIndex(startIndex);
    if (swiperRef.current) {
      swiperRef.current.slideTo(startIndex, 0);
    }
  };

  const goToSlide = (index) => {
    setActiveIndex(index);
    swiperRef.current?.slideTo(index);
  };

  if (!images || images.length === 0) return null;

  const showThumbs = images.length > 1;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      TransitionProps={{ onEntered: handleOpen }}
      fullScreen={isMobile}
      maxWidth="md"
      fullWidth={!isMobile}
      PaperProps={{
        sx: {
          backgroundColor: "rgba(0,0,0,0.95)",
          backgroundImage: "none",
          overflow: "hidden",
          position: "relative",
          display: "flex",
          flexDirection: "column",
        },
      }}
    >
      {/* Top bar: counter + close */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          px: 2,
          pt: 1.5,
          pb: 0.5,
          flexShrink: 0,
        }}
      >
        <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.75)" }}>
          {activeIndex + 1} / {images.length}
        </Typography>
        <IconButton
          onClick={onClose}
          size="small"
          sx={{
            position: "absolute",
            right: 8,
            color: "#fff",
            backgroundColor: "rgba(255,255,255,0.1)",
            "&:hover": { backgroundColor: "rgba(255,255,255,0.2)" },
          }}
        >
          <X size={18} />
        </IconButton>
      </Box>

      {/* Main image viewer */}
      <Box
        sx={{
          flex: 1,
          position: "relative",
          display: "flex",
          alignItems: "center",
          overflow: "hidden",
          minHeight: 0,
        }}
      >
        {/* Prev button */}
        <IconButton
          className="swiper-button-prev-custom"
          sx={{
            position: "absolute",
            left: 8,
            zIndex: 10,
            color: "#fff",
            backgroundColor: "rgba(255,255,255,0.1)",
            "&:hover": { backgroundColor: "rgba(255,255,255,0.2)" },
          }}
        >
          <ArrowLeft size={20} />
        </IconButton>

        {/* Next button */}
        <IconButton
          className="swiper-button-next-custom"
          sx={{
            position: "absolute",
            right: 8,
            zIndex: 10,
            color: "#fff",
            backgroundColor: "rgba(255,255,255,0.1)",
            "&:hover": { backgroundColor: "rgba(255,255,255,0.2)" },
          }}
        >
          <ArrowRight size={20} />
        </IconButton>

        <Swiper
          modules={[Navigation]}
          initialSlide={startIndex}
          navigation={{
            prevEl: ".swiper-button-prev-custom",
            nextEl: ".swiper-button-next-custom",
          }}
          onSwiper={(swiper) => { swiperRef.current = swiper; }}
          onSlideChange={(swiper) => setActiveIndex(swiper.activeIndex)}
          style={{ width: "100%", height: isMobile ? "calc(100dvh - 120px)" : 420 }}
        >
          {images.map((img, i) => (
            <SwiperSlide
              key={i}
              style={{ display: "flex", alignItems: "center", justifyContent: "center" }}
            >
              <Box
                component="img"
                src={img.url}
                alt={img.fileName}
                sx={{
                  maxWidth: "100%",
                  maxHeight: "100%",
                  objectFit: "contain",
                  display: "block",
                }}
              />
            </SwiperSlide>
          ))}
        </Swiper>
      </Box>

      {/* Thumbnail strip */}
      {showThumbs && (
        <Box
          sx={{
            flexShrink: 0,
            display: "flex",
            gap: 1,
            px: 2,
            py: 1.5,
            overflowX: "auto",
            justifyContent: images.length <= 6 ? "center" : "flex-start",
            "&::-webkit-scrollbar": { height: 4 },
            "&::-webkit-scrollbar-thumb": { backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 2 },
          }}
        >
          {images.map((img, i) => (
            <Box
              key={i}
              onClick={() => goToSlide(i)}
              sx={{
                width: THUMB_SIZE,
                height: THUMB_SIZE,
                minWidth: THUMB_SIZE,
                borderRadius: 1,
                overflow: "hidden",
                cursor: "pointer",
                border: i === activeIndex
                  ? `2px solid ${theme.palette.primary.main}`
                  : "2px solid transparent",
                opacity: i === activeIndex ? 1 : 0.5,
                transition: "opacity 0.2s, border-color 0.2s",
                "&:hover": { opacity: 1 },
              }}
            >
              <Box
                component="img"
                src={img.url}
                alt={img.fileName}
                sx={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
              />
            </Box>
          ))}
        </Box>
      )}
    </Dialog>
  );
};

export default ImageLightbox;
