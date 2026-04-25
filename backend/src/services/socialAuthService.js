import createHttpError from "http-errors";

import { UserModel } from "../models/index.js";
import { generatePassword } from "../utils/generatePassword.js";
import { generateLoginTokens } from "./authService.js";

const userData = (user, access_token) => {
  return {
    _id: user._id,
    firstName: user.firstName,
    lastName: user.lastName,
    avatar: user.avatar,
    email: user.email,
    activityStatus: user.activityStatus,
    onlineStatus: user.onlineStatus,
    token: access_token,
  };
};

export const handleSocialUser = async (
  email,
  name,
  picture,
  socialType,
  res
) => {
  let user = await UserModel.findOne({ email }).select("-password");

  if (user) {
    user.verified = true;

    // Check if Google is already connected
    if (!user.socialsConnected.includes(socialType)) {
      user.socialsConnected.push(socialType);
    }

    if (!user.avatar || user.avatar === "") {
      user.avatar = picture;
    }

    await user.save();
  } else {
    // Splitting name into firstName and lastName
    let firstName = "";
    let lastName = "";
    const nameParts = name.split(" ");
    if (nameParts.length > 1) {
      firstName = nameParts[0];
      lastName = nameParts.slice(1).join(" ");
    } else {
      // If only one word in name, set firstName to the name and lastName to onWhisprl
      firstName = name;
      lastName = "onWhisprl";
    }

    const newPass = generatePassword();

    // If user doesn't exist
    user = new UserModel({
      firstName: firstName,
      lastName: lastName,
      email: email,
      avatar: picture,
      verified: true,
      googleAuthAdded: true,
      password: newPass,
      socialsConnected: ["google"],
    });

    await user.save();
  }

  // generating login tokens
  const access_token = await generateLoginTokens(user, res);

  return userData(user, access_token);
};
