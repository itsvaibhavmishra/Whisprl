import { useEffect, useRef } from "react";
import Stack from "@mui/material/Stack";

import NoData from "@/components/NoData";
import { MembersList } from "@/data";
import AllChatElement from "@/sections/contacts/AllChatElement";

import Lottie from "react-lottie";
import * as SearchNotFound from "@/assets/illustrations/animations/SearchNotFound.json";
import { scrollToBottom } from "@/utils/scrollToBottom";

const ChatSearchResults = ({
  isLoading,
  searchResults,
  searchCount,
  currentPage,
  onSearchPageChange,
  currentUser,
  fromContact,
  toggleDrawer,
}) => {
  const containerRef = useRef(null);
  const debounceTimeoutRef = useRef(null);

  useEffect(() => {
    if (currentPage - 1 !== 0) {
      scrollToBottom(containerRef);
    }
  }, [currentPage]);

  useEffect(() => {
    const container = containerRef.current;

    const handleScroll = () => {
      // Clear any existing debounce timeout
      clearTimeout(debounceTimeoutRef.current);

      // Set a new debounce timeout
      debounceTimeoutRef.current = setTimeout(() => {
        // Check if the user has reached the bottom of the container
        if (
          container.scrollTop + container.clientHeight >=
          container.scrollHeight - 10
        ) {
          const maxPages = Math.ceil(searchCount / 10);
          // If there are more results to load based on searchCount
          if (maxPages > currentPage) {
            // Increment the page count and dispatch SearchFriends with the new page
            onSearchPageChange();
          }
        }
      }, 200); // Adjust the debounce delay as needed (e.g., 200 milliseconds)
    };

    // Attach the scroll event listener to the container
    container.addEventListener("scroll", handleScroll);

    // Clean up the event listener and debounce timeout when the component unmounts
    return () => {
      container.removeEventListener("scroll", handleScroll);
      clearTimeout(debounceTimeoutRef.current);
    };
  }, [searchResults, searchCount, onSearchPageChange, currentPage]);
  return (
    <Stack
      ref={containerRef}
      direction={"column"}
      sx={{
        flexGrow: 1,
        overflow: "scroll",
        height: "100%",
        overflowY: "auto",
        overflowX: "hidden",
      }}
      spacing={2}
    >
      <Stack spacing={2.4}>
        {/* initial loader */}
        {isLoading && currentPage - 1 === 0 ? (
          MembersList.map((e) => (
            <AllChatElement key={e._id} {...e} isLoading={isLoading} />
          ))
        ) : // search results
        searchResults !== null ? (
          searchResults.map((e) => (
            <AllChatElement
              key={e._id}
              latestMessage={
                e._id === currentUser
                  ? { message: "Message yourself" }
                  : e.latestMessage
              }
              {...e}
              toggleDrawer={toggleDrawer}
              fromContact={fromContact}
            />
          ))
        ) : (
          // no results
          <NoData label={"No Users Found!"}>
            <Lottie
              options={{
                loop: true,
                autoplay: true,
                animationData: SearchNotFound,
                rendererSettings: {
                  preserveAspectRatio: "xMidYMid slice",
                },
              }}
              isClickToPauseDisabled={true}
            />
          </NoData>
        )}
      </Stack>
    </Stack>
  );
};

export default ChatSearchResults;
