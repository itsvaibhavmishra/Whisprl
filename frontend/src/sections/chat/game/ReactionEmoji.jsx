import { useEffect, useState } from "react";
import { Box } from "@mui/material";
import { useReducedMotion } from "motion/react";

// Google's Noto animated emoji, scaled down to ship with the app; credited in the Readme
const artOf = (emoji) => `${import.meta.env.BASE_URL}reactions/${[...emoji].map((character) => character.codePointAt(0).toString(16)).join("_")}.webp`;

const files = new Map();

const fileOf = (src) => {
  if (!files.has(src)) {
    const loading = fetch(src).then((response) => (response.ok ? response.blob() : Promise.reject(new Error(`No reaction at ${src}`))));
    // a failed load may work next time, so it is not kept
    loading.catch(() => files.delete(src));
    files.set(src, loading);
  }
  return files.get(src);
};

// every image of one address shares one clock, so each emoji gets an address of its own and plays from its first frame
const useOwnCopy = (src, isWanted) => {
  const [address, setAddress] = useState(null);
  useEffect(() => {
    if (!isWanted) return undefined;
    let copy = null;
    let isCurrent = true;
    fileOf(src)
      .then((file) => {
        if (!isCurrent) return;
        copy = URL.createObjectURL(file);
        setAddress(copy);
      })
      .catch(() => {});
    return () => {
      isCurrent = false;
      if (copy) URL.revokeObjectURL(copy);
    };
  }, [src, isWanted]);
  return address;
};

// the plain emoji holds the spot until its animation has loaded, so a thrown one never shows as a gap
const ReactionEmoji = ({ emoji, size }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const isStill = useReducedMotion();
  const address = useOwnCopy(artOf(emoji), !isStill);
  const isAnimated = isLoaded && !isStill;

  return (
    <Box component="span" role="img" aria-label={emoji} sx={{ display: "inline-grid", placeItems: "center", width: size, height: size, flexShrink: 0 }}>
      {address && (
        <Box
          component="img"
          src={address}
          alt=""
          draggable={false}
          onLoad={() => setIsLoaded(true)}
          sx={{ gridArea: "1 / 1", width: size, height: size, opacity: isAnimated ? 1 : 0 }}
        />
      )}
      {!isAnimated && (
        <Box component="span" aria-hidden sx={{ gridArea: "1 / 1", fontSize: size * 0.8, lineHeight: 1 }}>
          {emoji}
        </Box>
      )}
    </Box>
  );
};

export default ReactionEmoji;
