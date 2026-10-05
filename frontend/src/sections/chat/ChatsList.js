import { Fragment, useEffect, useState } from "react";
import { Button, Stack, Typography, Divider, useTheme } from "@mui/material";
import { MagnifyingGlass, UsersThree } from "phosphor-react";

import { useDispatch, useSelector } from "react-redux";
import { SearchFriends } from "@/redux/slices/actions/userActions";
import { GetConversations } from "@/redux/slices/actions/chatActions";
import { clearSearch } from "@/redux/slices/userSlice";

import { MembersList } from "@/data";
import { Search, SearchIconWrapper, StyledInputBase } from "@/components/search";
import AllChatElement from "@/sections/chat/AllChatElement";
import CreateGroupDialog from "@/sections/chat/group/CreateGroupDialog";
import ChatSearchResults from "@/sections/chat/ChatSearchResults";
import { getOtherUser } from "@/utils/getOtherUser";
import OnlineFriendsElement from "@/components/OnlineFriendsElement";
import useIsLoading from "@/hooks/useIsLoading";

const ChatsList = () => {
  // using theme
  const theme = useTheme();

  // from redux
  const dispatch = useDispatch();
  const { user, onlineFriends, searchResults, searchCount } =
    useSelector((state) => state.user);
  const isLoading = useIsLoading(SearchFriends);
  const isLoadingConversations = useIsLoading(GetConversations);
  const { conversations, activeConversation } = useSelector(
    (state) => state.chat
  );

  // states
  const [searchTerm, setSearchTerm] = useState("");
  const [prevSearchTerm, setPrevSearchTerm] = useState("");
  const [usersFound, setUsersFound] = useState([]);
  const [page, setPage] = useState(1);
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);

  // -------------- inner functions --------------
  // function to handle searched term
  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setPage(1);
  };

  // using debounce method to dispatch action after search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm !== "") {
        const searchData = { keyword: searchTerm, page: 0 };
        dispatch(SearchFriends(searchData));
      } else {
        dispatch(clearSearch());
      }
    }, 500);

    return () => {
      clearTimeout(timer);
    };
  }, [dispatch, searchTerm]);

  // function to handle page change
  const handleSearchPageChange = () => {
    // Increment the page count and dispatch SearchFriends with the new page
    setPage((prevpage) => prevpage + 1);
    const searchData = { keyword: searchTerm, page: page };
    dispatch(SearchFriends(searchData));
  };

  // After the searchResults are updated, set them to usersFound
  useEffect(() => {
    if (searchResults?.length > 0) {
      if (
        prevSearchTerm === searchTerm &&
        JSON.stringify(usersFound) !== JSON.stringify(searchResults) &&
        usersFound
      ) {
        setUsersFound((prevUsersFound) => [
          ...prevUsersFound,
          ...searchResults,
        ]);
      } else {
        setUsersFound(searchResults);
      }
    } else if (searchResults === null) {
      setUsersFound(null);
    } else {
      setUsersFound([]);
    }

    // Update prevSearchTerm
    setPrevSearchTerm(searchTerm);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchResults]);

  // --------------------------------------------

  return (
    <Stack p={3} spacing={2} sx={{ height: "100%" }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between">
        <Typography component={"h1"} variant="h5">
          Chats
        </Typography>
        <Button size="small" startIcon={<UsersThree size={18} />} onClick={() => setIsCreatingGroup(true)}>
          New group
        </Button>
      </Stack>
      <CreateGroupDialog open={isCreatingGroup} onClose={() => setIsCreatingGroup(false)} />

      {/* Search section */}
      <Stack sx={{ width: "100%" }}>
        <Search>
          <SearchIconWrapper>
            <MagnifyingGlass color={theme.palette.primary.main} />
          </SearchIconWrapper>
          <StyledInputBase
            placeholder="Search..."
            inputProps={{ "aria-label": "search" }}
            onChange={(e) => handleSearch(e)}
          />
        </Search>
      </Stack>

      {!searchTerm ? (
        <>
          {/* Online Friends Slider */}
          <OnlineFriendsElement />

          <Divider />

          <Typography
            component={"h2"}
            variant="subtitle2"
            sx={{ color: "#676767" }}
          >
            Recent Chats
          </Typography>

          {/* Chats setion starts here */}
          <Stack
            direction={"column"}
            sx={{
              flexGrow: 1,
              overflow: "scroll",
              height: "100%",
              overflowY: "auto",
              overflowX: "hidden",
            }}
            spacing={2}
            className="scrollbar"
          >
            {/* All Chats */}
            <Stack spacing={2.4}>
              {/* loding skeleton */}
              {isLoadingConversations && !conversations.length
                ? MembersList.map((e) => {
                    return (
                      <AllChatElement
                        key={e._id}
                        {...e}
                        isLoading
                      />
                    );
                  })
                : conversations
                    .filter(
                      (e) =>
                        e.latestMessage ||
                        e._id === activeConversation?._id
                    )
                    .map((conversation) => {
                      const { users } = conversation;

                      if (conversation.isGroup) {
                        return (
                          <AllChatElement
                            key={conversation._id}
                            group={conversation}
                            convo_id={conversation._id}
                            latestMessage={conversation.latestMessage}
                          />
                        );
                      }

                      const chatElementProps = getOtherUser(
                        users,
                        user._id,
                        onlineFriends
                      );

                      return (
                        chatElementProps && (
                          <AllChatElement
                            key={conversation._id}
                            convo_id={conversation._id}
                            latestMessage={conversation.latestMessage}
                            {...chatElementProps}
                          />
                        )
                      );
                    })}
            </Stack>
          </Stack>
        </>
      ) : (
        // Search Results
        <Fragment>
          <Divider />

          <Typography variant="subtitle2" sx={{ color: "#676767" }}>
            Search Result{searchCount > 0 && `: ${searchCount}`}
          </Typography>

          <ChatSearchResults
            isLoading={isLoading}
            searchResults={usersFound}
            searchCount={searchCount}
            currentPage={page}
            onSearchPageChange={handleSearchPageChange}
            currentUser={user._id}
            activeConversation={activeConversation}
          />
        </Fragment>
      )}
    </Stack>
  );
};

export default ChatsList;
