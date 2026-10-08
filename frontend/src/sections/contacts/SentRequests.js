import { useEffect } from "react";
import { Box, Stack, Grid, Typography, useTheme } from "@mui/material";
import Lottie from "react-lottie";

import UserCard from "@/sections/contacts/UserCard";
import { Friend_Requests } from "@/data";
import HangingBuddy from "@/assets/illustrations/animations/HangingBuddy.json";

// redux imports
import { useDispatch, useSelector } from "react-redux";
import { GetRequests } from "@/redux/slices/actions/contactActions";
import RequestNote from "@/components/profile/RequestNote";
import useIsLoading from "@/hooks/useIsLoading";

const SentRequests = () => {
  const theme = useTheme();

  // from redux
  const dispatch = useDispatch();
  const isSentRequestsLoading = useIsLoading(GetRequests);
  const outgoing = useSelector((state) => state.contact.outgoing);
  const { showFriendsMenu } = useSelector((state) => state.user);

  useEffect(() => {
    dispatch(GetRequests());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showFriendsMenu]);

  return (
    <Box height={"100%"} width={"100%"} p={2}>
      <Stack spacing={1} alignItems={"center"} justifyContent={"center"}>
        <Typography
          variant="caption"
          sx={{ color: theme.palette.text.secondary, textAlign: "center" }}
        >
          Here's a list of users whome you have sent a request | Click on a card
          to visit user
        </Typography>
        <Grid container spacing={3}>
          {!isSentRequestsLoading ? (
            outgoing.length !== 0 ? (
              outgoing.map((request) => (
                <UserCard
                  thisUser={request.person}
                  fromSection={"SentRequests"}
                  note={<RequestNote request={request} isMine />}
                  key={request._id}
                />
              ))
            ) : (
              <Stack
                sx={{ height: "100%", width: "100%" }}
                alignItems={"center"}
                justifyContent={"center"}
              >
                <Box sx={{ width: { xs: "25em", md: "30em" } }}>
                  <Lottie
                    options={{
                      loop: true,
                      autoplay: true,
                      animationData: HangingBuddy,
                      rendererSettings: {
                        preserveAspectRatio: "xMidYMid slice",
                      },
                    }}
                    isClickToPauseDisabled={true}
                  />
                </Box>
                <Typography variant="subtitle2">No Requests Found</Typography>
              </Stack>
            )
          ) : (
            // Loading Cards
            Friend_Requests.map((sender) => (
              <UserCard
                key={sender._id}
                thisUser={sender}
                fromSection={"SentRequests"}
                isLoading={isSentRequestsLoading}
              />
            ))
          )}
        </Grid>
      </Stack>
    </Box>
  );
};

export default SentRequests;
