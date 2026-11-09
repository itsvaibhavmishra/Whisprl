import { Box, ButtonBase, IconButton, Stack, Typography } from "@mui/material";
import { CameraIcon, XIcon } from "@phosphor-icons/react";
import { useDispatch, useSelector } from "react-redux";

import { useCroppedImage } from "@/components/ImageMenu";
import useIsLoading from "@/hooks/useIsLoading";
import { GetOnboarding, SkipSetupStep } from "@/redux/slices/actions/onboardingActions";
import { UpdateProfile } from "@/redux/slices/actions/userActions";
import getAvatar from "@/utils/avatars";
import { dateInputOf } from "@/utils/birthdays";
import { coverStyleOf } from "@/utils/covers";

// offered here rather than in setup, so a photo is one tap away without standing between someone and their first chat
const PhotoCard = () => {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.user.user);
  const isSaving = useIsLoading(UpdateProfile);

  // the profile is saved whole, so everything but the photo goes back as it already is
  const savePhoto = async (photo) => {
    const { pattern, palette } = coverStyleOf(user);
    const result = await dispatch(
      UpdateProfile({
        firstName: user.firstName,
        lastName: user.lastName,
        activityStatus: user.activityStatus ?? "",
        birthday: dateInputOf(user.birthday),
        coverPattern: pattern,
        coverPalette: palette,
        avatar: photo,
        cover: user.cover || "",
      })
    );
    if (UpdateProfile.fulfilled.match(result)) dispatch(GetOnboarding());
  };

  const { pick, picker } = useCroppedImage("photo", savePhoto);

  return (
    <Stack direction="row" sx={{ alignItems: "center", gap: 0.5, mb: 1, borderRadius: 3, bgcolor: "chat.field" }}>
      <ButtonBase
        onClick={pick}
        disabled={isSaving}
        sx={{ flex: 1, minWidth: 0, gap: 1.5, px: 1, py: 1, borderRadius: 3, justifyContent: "flex-start", textAlign: "left" }}
      >
        <Box sx={{ position: "relative", flexShrink: 0 }}>
          {getAvatar(user.avatar, `${user.firstName} ${user.lastName}`, 50)}
          <Box
            sx={{
              position: "absolute",
              right: -2,
              bottom: -2,
              width: 22,
              height: 22,
              borderRadius: "50%",
              display: "grid",
              placeItems: "center",
              color: "primary.contrastText",
              bgcolor: "primary.main",
              border: 2,
              borderColor: "chat.field",
            }}
          >
            <CameraIcon size={12} weight="bold" />
          </Box>
        </Box>
        <Box sx={{ minWidth: 0 }}>
          <Typography sx={{ fontSize: 15, fontWeight: 700 }}>{isSaving ? "Saving your photo…" : "Add a photo"}</Typography>
          <Typography sx={{ fontSize: 13, fontWeight: 500, color: "text.secondary" }}>So your friends recognise you</Typography>
        </Box>
      </ButtonBase>
      <IconButton aria-label="Not now" onClick={() => dispatch(SkipSetupStep("profile"))} sx={{ mr: 0.5, color: "text.secondary" }}>
        <XIcon size={18} />
      </IconButton>
      {picker}
    </Stack>
  );
};

export default PhotoCard;
