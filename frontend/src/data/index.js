import {
  //   Nav Buttons
  UserCircle,
  ChatCircleDots,
  Users,
  UserList,
  Gear,

  //   Profile Menu
  IdentificationCard,

  // Text Field Actions
  Image,
  GameController,
  File,
  User,
} from "phosphor-react";

const MembersList = [
  {
    _id: 0,
    firstName: "Vaibhav",
    lastName: "Mishra",
    avatar: "",
    activityStatus: "Hey there! I love using Whisprl ❤️",
    msg: "Hello",
    time: "9:36",
    unread: 2,
    pinned: false,
    online: true,
  },
  {
    _id: 1,
    firstName: "Gaibhav",
    lastName: "Mishra",
    avatar: "",
    activityStatus: "Hey there! I love using Whisprl ❤️",
    msg: "Hello",
    time: "9:36",
    unread: 0,
    pinned: false,
    online: true,
  },
  {
    _id: 2,
    firstName: "Baibhav",
    lastName: "Mishra",
    avatar: "",
    activityStatus: "Hey there! I love using Whisprl ❤️",
    msg: "Hello",
    time: "9:36",
    unread: 5,
    pinned: false,
    online: true,
  },
  {
    _id: "65787ea22c8433b199ced18d",
    firstName: "Aaibhav",
    lastName: "Mishra",
    avatar: "",
    activityStatus: "Hey there! I love using Whisprl ❤️",
    msg: "Hello",
    time: "9:36",
    unread: 0,
    pinned: false,
    online: true,
  },
];

const Friend_Requests = [
  {
    _id: "65870774cd86e8c7c9b358eb",
    firstName: "User",
    lastName: "1",
    avatar: "",
    email: "user@gmail.com",
    createdAt: "2023-12-12T15:39:14.688+00:00",
  },
  {
    _id: "65787ea22c8433b199ced18e",
    firstName: "Akshat",
    lastName: "Mishra",
    avatar: "",
    email: "akshat@gmail.com",
    createdAt: "2023-12-12T15:39:14.688+00:00",
  },
  {
    _id: "65bbb5db34b2e8f010a59452",
    firstName: "Dhananjay",
    lastName: "Jain",
    avatar: "",
    email: "dhananjay@gmail.com",
    createdAt: "2023-12-12T15:39:14.688+00:00",
  },
  {
    _id: "65d1f4411203451e7ea8b44b",
    firstName: "Vipul",
    lastName: "Kumar",
    avatar: "",
    email: "vipulk0000@gmail.com",
    createdAt: "2023-12-12T15:39:14.688+00:00",
  },
];

const Nav_Buttons = [
  {
    index: 0,
    icon: <UserCircle size={28} />,
    address: "profile", // route to /profile
  },
  {
    index: 1,
    icon: <ChatCircleDots />,
    address: "app", // route to /app
  },
  {
    index: 2,
    icon: <Users />,
    address: "group", // route to /group
  },
  {
    index: 3,
    icon: <UserList />,
    address: "contact", // route to /contact
  },
  {
    index: 4,
    icon: <Gear />,
    address: "settings", // route to /settings
  },
];

const Profile_Menu = [
  {
    title: "Profile",
    icon: <IdentificationCard size={18} />,
    address: "profile", // route to /profile
  },
  {
    title: "Settings",
    icon: <Gear size={18} />,
    address: "settings", // route to /settings
  },
];

const Actions = [
  {
    color: "darker",
    contrast: "#fff",
    icon: <GameController weight="fill" size={24} />,
    title: "Gaming",
  },
  {
    color: "dark",
    contrast: "#fff",
    icon: <Image weight="fill" size={24} />,
    title: "Photo",
  },
  {
    color: "light",
    contrast: "#333",
    icon: <File size={24} />,
    title: "Document",
  },
  {
    color: "lighter",
    contrast: "#222",
    icon: <User size={24} />,
    title: "Contact",
  },
];

export { Nav_Buttons, MembersList, Friend_Requests, Profile_Menu, Actions };
