import { useEffect, useRef } from "react";
import Grid from "@mui/material/Grid";

import NoData from "@/components/NoData";

import Lottie from "react-lottie";
import * as SearchNotFound from "@/assets/illustrations/animations/SearchNotFound.json";
import { scrollToBottom } from "@/utils/scrollToBottom";
import { Friend_Requests } from "@/data";
import UserCard from "@/sections/contacts/UserCard";

const UsersSearchResults = ({
  isLoading,
  searchResults,
  searchCount,
  currentPage,
  onSearchPageChange,
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
    <Grid
      container
      mt={1}
      spacing={3}
      ref={containerRef}
      sx={{
        flexGrow: 1,
        overflow: "scroll",
        height: { xs: "calc(100vh - 320px)", md: "calc(100vh - 240px)" },
        overflowY: "auto",
        overflowX: "hidden",
        zIndex: 2,
      }}
      className="scrollbar"
    >
      {/* initial loader */}
      {isLoading && currentPage - 1 === 0 ? (
        Friend_Requests.map((e) => (
          <UserCard
            key={e._id}
            thisUser={e}
            fromSection={"SearchUsers"}
            isLoading={isLoading}
          />
        ))
      ) : // search results
      searchResults !== null ? (
        searchResults.map((e) => (
          <UserCard
            key={e._id}
            thisUser={e}
            fromSection={"SearchUsers"}
            isLoading={false}
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

      {searchResults !== null && searchResults.length !== 0 && isLoading && (
        <UserCard
          thisUser={searchResults[0]?._id}
          fromSection={"SearchUsers"}
          isLoading={isLoading}
        />
      )}
    </Grid>
  );
};

export default UsersSearchResults;
