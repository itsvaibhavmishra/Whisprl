import { useEffect } from "react";
import { Box, Stack, Grid, Typography, useTheme } from "@mui/material";
import Lottie from "react-lottie";

import UserCard from "@/sections/contacts/UserCard";
import { Friend_Requests } from "@/data";
import NoResultsFound from "@/assets/illustrations/animations/NoResultsFound.json";

// redux imports
import { useDispatch, useSelector } from "react-redux";
import { GetRequests } from "@/redux/slices/actions/contactActions";
import RequestNote from "@/components/profile/RequestNote";
import useIsLoading from "@/hooks/useIsLoading";

const FriendRequests = () => {
  const theme = useTheme();

  // from redux
  const dispatch = useDispatch();
  const isRequestsLoading = useIsLoading(GetRequests);
  const incoming = useSelector((state) => state.contact.incoming);
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
          Below is the list of received friend requests | Click on a card to
          visit user
        </Typography>
        <Grid container spacing={3}>
          {!isRequestsLoading ? (
            incoming.length !== 0 ? (
              incoming.map((request) => (
                <UserCard
                  thisUser={request.person}
                  fromSection={"FriendRequests"}
                  note={<RequestNote request={request} isMine={false} />}
                  key={request._id}
                />
              ))
            ) : (
              <Stack
                sx={{ height: "100%", width: "100%" }}
                alignItems={"center"}
                justifyContent={"center"}
              >
                <Box sx={{ width: { xs: "25em", md: "40em" } }}>
                  <Lottie
                    options={{
                      loop: true,
                      autoplay: true,
                      animationData: NoResultsFound,
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
                fromSection={"FriendRequests"}
                isLoading={isRequestsLoading}
              />
            ))
          )}
        </Grid>
      </Stack>
    </Box>
  );
};

export default FriendRequests;
