import Stack from "@mui/material/Stack";
import useMediaQuery from "@mui/material/useMediaQuery";
import { Swiper, SwiperSlide } from "swiper/react";
import { useSelector } from "react-redux";

import { MembersList } from "@/data";
import OnlineChatElement from "@/sections/chat/OnlineChatElement";

const OnlineFriendsElement = ({ fromContact }) => {
  const { user, onlineFriends, isLoading } = useSelector((state) => state.user);

  const isMediumScreen = useMediaQuery((theme) => theme.breakpoints.up("md"));
  const isSmallScreen = useMediaQuery((theme) => theme.breakpoints.up("sm"));
  const isSmallerScreen = useMediaQuery((theme) => theme.breakpoints.up("xs"));

  const getSlidesPerView = () => {
    if (isMediumScreen) {
      return "3.5";
    } else if (isSmallScreen) {
      return "6.5";
    } else if (isSmallerScreen) {
      return "3.5";
    }
  };

  const slidesPerView = getSlidesPerView();

  return (
    <Stack spacing={1}>
      <Swiper spaceBetween={20} slidesPerView={slidesPerView}>
        <Stack direction={"row"} alignItems={"center"} spacing={2}>
          {isLoading
            ? MembersList.filter((e) => e.online === true).map((e) => (
                <SwiperSlide key={e._id}>
                  <OnlineChatElement {...e} isLoading={isLoading} />
                </SwiperSlide>
              ))
            : onlineFriends
                .filter(
                  (e) => e._id !== user._id && e.onlineStatus === "online"
                )
                .map((e) => (
                  <SwiperSlide key={e._id}>
                    <OnlineChatElement
                      {...e}
                      isLoading={isLoading}
                      fromContact={fromContact}
                    />
                  </SwiperSlide>
                ))}
        </Stack>
      </Swiper>
    </Stack>
  );
};
export default OnlineFriendsElement;
