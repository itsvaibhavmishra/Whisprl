import { Fragment, useEffect, useState } from "react";
import {
  Stack,
  Typography,
  Divider,
  useTheme,
  IconButton,
} from "@mui/material";
import { UserPlus, MagnifyingGlass } from "phosphor-react";

// redux imports
import { useSelector, useDispatch } from "react-redux";
import { GetFriends, SearchFriends } from "@/redux/slices/actions/userActions";
import { clearSearch, setShowFriendsMenu } from "@/redux/slices/userSlice";

import { Search, SearchIconWrapper, StyledInputBase } from "@/components/search";
import ChatSearchResults from "@/sections/contacts/ChatSearchResults";
import AllChatElement from "@/sections/contacts/AllChatElement";
import OnlineFriendsElement from "@/sections/contacts/OnlineFriendsElement";
import { MembersList } from "@/data";
import UserProfileDrawer from "@/sections/friend-drawer/UserProfileDrawer";
import useIsLoading from "@/hooks/useIsLoading";

const ContactList = () => {
  // using theme
  const theme = useTheme();

  // from redux
  const dispatch = useDispatch();
  const { user, friends, searchResults, searchCount } = useSelector(
    (state) => state.user
  );
  const isSearching = useIsLoading(SearchFriends);
  const isLoadingFriends = useIsLoading(GetFriends) && !friends?.length;

  // states
  const [searchTerm, setSearchTerm] = useState("");
  const [prevSearchTerm, setPrevSearchTerm] = useState("");
  const [usersFound, setUsersFound] = useState([]);
  const [page, setPage] = useState(1);

  const [openDrawer, setOpenDrawer] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState("");

  // -------------- inner functions --------------
  // open close user drawer
  const toggleDrawer = (selectedId) => {
    setOpenDrawer(!openDrawer);

    setSelectedUserId(selectedId);
  };

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

  // Sort MembersList alphabetically by firstName
  const sortedMembersList = friends
    ?.slice()
    .sort((a, b) => a.firstName.localeCompare(b.firstName));

  // Group contacts by first letter of firstName
  const groupedContacts = sortedMembersList.reduce((acc, contact) => {
    const firstLetter = contact.firstName[0].toUpperCase();
    if (!acc[firstLetter]) {
      acc[firstLetter] = [];
    }
    acc[firstLetter].push(contact);
    return acc;
  }, {});
  // --------------------------------------------

  return (
    <Stack height={"100%"}>
      <Stack p={3} spacing={2} sx={{ height: "100%" }}>
        <Stack direction={"row"} justifyContent={"space-between"}>
          <Typography component={"h1"} variant="h5">
            Contacts
          </Typography>
          <IconButton
            onClick={() => dispatch(setShowFriendsMenu())}
            sx={{ display: { xs: "flex", md: "none" } }}
          >
            <UserPlus />
          </IconButton>
        </Stack>

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
            <OnlineFriendsElement fromContact={true} />
            <Divider />

            <Typography
              component={"h2"}
              variant="subtitle2"
              sx={{ color: "#676767" }}
            >
              All Contacts
            </Typography>

            {/* Contacts section starts here */}
            <Stack
              direction={"column"}
              sx={{
                flexGrow: 1,
                overflow: "scroll",
                height: "100%",
                overflowY: "auto",
                overflowX: "hidden",
              }}
              spacing={4}
              className="scrollbar"
            >
              {isLoadingFriends
                ? MembersList.map((e) => {
                    return (
                      <AllChatElement
                        key={e._id}
                        {...e}
                        isLoading
                      />
                    );
                  })
                : //Render contacts grouped by first letter
                  Object.entries(groupedContacts).map(([letter, contacts]) => (
                    <Stack spacing={0.5} key={letter}>
                      <Typography variant="subtitle2">{letter}</Typography>
                      {contacts.map((contact) => (
                        <AllChatElement
                          key={contact._id}
                          {...contact}
                          latestMessage={
                            contact._id === user._id
                              ? { message: "Message yourself" }
                              : contact.latestMessage
                          }
                          fromContact={true}
                          toggleDrawer={toggleDrawer}
                        />
                      ))}
                    </Stack>
                  ))}
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
              isLoading={isSearching}
              searchResults={usersFound}
              searchCount={searchCount}
              currentPage={page}
              onSearchPageChange={handleSearchPageChange}
              currentUser={user._id}
              toggleDrawer={toggleDrawer}
              fromContact={true}
            />
          </Fragment>
        )}
      </Stack>

      <UserProfileDrawer
        openDrawer={openDrawer}
        toggleDrawer={toggleDrawer}
        selectedUserData={{ _id: selectedUserId }}
        isFrom={"Contacts"}
      />
    </Stack>
  );
};

export default ContactList;
