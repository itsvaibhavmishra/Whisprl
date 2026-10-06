import { useEffect } from "react";
import { useDispatch } from "react-redux";

import DashboardPage from "@/layouts/dashboard/DashboardPage";
import { GetMyProfile } from "@/redux/slices/actions/userActions";
import ProfileEditor from "@/sections/profile/ProfileEditor";

const Profile = () => {
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(GetMyProfile());
  }, [dispatch]);

  return (
    <DashboardPage
      title="Profile"
      description="This is the card your friends see when they open your profile. Change anything and it updates as you type."
      maxWidth={1040}
    >
      <ProfileEditor />
    </DashboardPage>
  );
};

export default Profile;
