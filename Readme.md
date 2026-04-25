> [!IMPORTANT]
> Please leave a ⭐ if you like this project.

# Whisprl 😺

A Real-Time web-based MERN Chat App by Vaibhaw Mishra.
{ Development in Progress }

![Whisprl](https://i.imgur.com/CMGzVa3.png)

## ✅ Site Status

Live At: <a href="https://whisprl.netlify.app">Netlify | Whisprl</a>
 > [!TIP]
[![Netlify Status](https://api.netlify.com/api/v1/badges/11d93069-5655-4db9-b73d-b34de9c5deab/deploy-status)](https://app.netlify.com/sites/whisprl/deploys)

## 💻 Tech Stack

![MongoDB](https://img.shields.io/badge/mongodb-001E2B?style=for-the-badge&logo=mongodb&logoColor=00ED64)
![Express](https://img.shields.io/badge/Express.js-404D59?style=for-the-badge)
![React.JS](https://img.shields.io/badge/React.js-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB)
![Node.JS](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)
![MUI](https://img.shields.io/static/v1?style=for-the-badge&message=MUI&color=007FFF&logo=MUI&logoColor=FFFFFF&label=)
![Socket.io](https://img.shields.io/badge/Socket.io-black?style=for-the-badge&logo=socket.io&badgeColor=010101)
![React Redux](https://img.shields.io/badge/Redux-593D88?style=for-the-badge&logo=redux&logoColor=white)
![React Router](https://img.shields.io/static/v1?style=for-the-badge&message=React+Router&color=CA4245&logo=React+Router&logoColor=FFFFFF&label=)
![Cloudinary](https://img.shields.io/static/v1?style=for-the-badge&message=Cloudinary&color=3448C5&logo=Cloudinary&logoColor=FFFFFF&label=)
![React Hook Form](https://img.shields.io/badge/React%20Hook%20Form-%23EC5990.svg?style=for-the-badge&logo=reacthookform&logoColor=white)
![JWT](https://img.shields.io/badge/JWT-black?style=for-the-badge&logo=JSON%20web%20tokens)
![Swiper](https://img.shields.io/static/v1?style=for-the-badge&message=Swiper&color=6332F6&logo=Swiper&logoColor=FFFFFF&label=)
![Framer Motion](https://img.shields.io/static/v1?style=for-the-badge&message=Framer+Motion&color=242424&logo=Framer&logoColor=FFFFFF&label=)
![Git](https://img.shields.io/badge/git-%23F05033.svg?style=for-the-badge&logo=git&logoColor=white)
![GitHub](https://img.shields.io/static/v1?style=for-the-badge&message=GitHub&color=181717&logo=GitHub&logoColor=FFFFFF&label=)
![NodeMailer](https://img.shields.io/static/v1?style=for-the-badge&message=NodeMailer&color=1CB674&logo=Node.js&logoColor=FFFFFF&label=)
![Google Analytics](https://img.shields.io/static/v1?style=for-the-badge&message=Google+Analytics&color=E37400&logo=Google+Analytics&logoColor=FFFFFF&label=)

## 📃 Features List

#### 👦🏻 User Features

    - Real-time one-to-one chat

    - reCAPTCHA support

    - Robust authentication system with dynamic flow

    - OTP based verification and password reset functionality

    - 3 Social logins methods (Google, GitHub & LinkedIn)

    - Disposable email check

    - Highly responsive UI

    - Dark/Light theme support

    - 6 different color presets

    - Custom movable sidebar for theme settings

    - Profile section with image cropper & drag-n-drop support

    - Search friends with infinite scrolling

    - Emoji support

    - Real-time online status

    - Real-time typing... message

    - Dynamic friends contact menu

#### 🧑🏻‍💻 Developer Features

<b>Backend:</b>

    - Added security options (Rate Limit, XSS Protection, Sanitization, URL Encoding & more)

    - Dynamic server & routes error handling

    - Dedicted folder structure

    - JWT Middlewares for both APIs & Socket based requests

    - Cloudinary file upload system with auto folder structuring

    - Access & Refresh token with cookies support

    - Structured DB with pre save & validations

    - And much more

<b>Frontend:</b>

    - Custom axios setup for easier API calling

    - Custom error interceptors for axios error handlings

    - Redux toolkit with persist

    - Custom hooks

    - Auto refresh tokens & auto token verification

    - Google Ananlytics support

    - Dynamic routing with lazy loading

    - Custom loader

    - Customized theme with dedicated folder structuring

    - React Hook Form with Yup form validations

    - Custom utils folder

    - And much more

## 👾 Installation

### Bankend:

From root directory, move to the backend using command

```bash
$ cd backend/
```

Install dependencies for server

```bash
$ npm install
```

Setup .env using `.env copy` file

```bash
$ located in backend/
```

Start the backend using nodemon

```bash
$ npm start
```

## Frontend:

From root directory, move to the frontend using command

```bash
$ cd frontend/
```

Install dependencies for frontend

```bash
$ npm install -f
```

Setup .env using `.env copy` file

```bash
$ located in frontend/
```

Runs frontend on localhost(React App)

```bash
$ npm start
```

Creates an optimized production build

```bash
$ npm run build
```

## 🪜 Folder Structure

  ```
├──backend/
│   ├── ...
├──frontend/
│   ├── ...
├── .gitignore
├── LICENSE
├── Readme.md
  ```

<details>
  <summary>Backend</summary>

```
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   │   ├── authController.js
│   │   │   ├── conversationController.js
│   │   │   ├── friendsController.js
│   │   │   ├── messageController.js
│   │   │   ├── socialController.js
│   │   │   ├── userController.js
│   │   ├── middlewares/
│   │   │   ├── authMiddleware.js
│   │   │   ├── socketMiddleware.js
│   │   ├── models/
│   │   │   ├── conversationModel.js
│   │   │   ├── friendRequestModel.js
│   │   │   ├── index.js
│   │   │   ├── messageModel.js
│   │   │   ├── userModel.js
│   │   ├── routes/
│   │   │   ├── authRouter.js
│   │   │   ├── conversationRouter.js
│   │   │   ├── friendsRouter.js
│   │   │   ├── index.js
│   │   │   ├── messageRouter.js
│   │   │   ├── userRouter.js
│   │   ├── services/
│   │   │   ├── authService.js
│   │   │   ├── conversationService.js
│   │   │   ├── fileUploadService.js
│   │   │   ├── friendsService.js
│   │   │   ├── mailer.js
│   │   │   ├── messageService.js
│   │   │   ├── socialAuthService.js
│   │   │   ├── tokenService.js
│   │   │   ├── userService.js
│   │   ├── Templates/
│   │   │   ├── Mail/
│   │   │   │   ├── otp.js
│   │   │   │   ├── reset.js
│   │   ├── utils/
│   │   │   ├── checkDispose.js
│   │   │   ├── filterObj.js
│   │   │   ├── generatePassword.js
│   │   │   ├── tokenGenerator.js
│   ├── .env copy
│   ├── app.js
│   ├── package-lock.json
│   ├── package.json
│   ├── server.js
│   ├── socket.js
│   ├── vercel.json
```
</details>

<details>
<summary>Frontend</summary>

```
├── frontend/
│   ├── public/
│   │   ├── favicon.ico
│   │   ├── index.html
│   │   ├── logo.ico
│   │   ├── manifest.json
│   │   ├── robots.txt
│   │   ├── sitemap.xml
│   │   ├── _redirects
│   ├── src/
│   │   ├── assets/
│   │   │   ├── backgrounds/
│   │   │   │   ├── catDoodle.png
│   │   │   │   ├── catDoodle2.png
│   │   │   │   ├── catDoodle3.png
│   │   │   ├── icons/
│   │   │   │   ├── flags/
│   │   │   │   │   ├── flag_am.svg
│   │   │   │   │   ├── flag_en.png
│   │   │   │   │   ├── flag_en.svg
│   │   │   │   │   ├── flag_fr.png
│   │   │   │   │   ├── flag_fr.svg
│   │   │   │   │   ├── flag_hi.png
│   │   │   │   │   ├── flag_hi.svg
│   │   │   │   │   ├── flag_ja.svg
│   │   │   │   │   ├── flag_vn.svg
│   │   │   │   ├── logo/
│   │   │   │   │   ├── Whisprl-old.png
│   │   │   │   │   ├── Whisprl.png
│   │   │   │   │   ├── WhisprlSub.png
│   │   │   │   │   ├── VaibhawMishra.ico
│   │   │   ├── Illustration/
│   │   │   │   ├── Animations/
│   │   │   │   │   ├── Cat404.json
│   │   │   │   │   ├── CatAnimation1.json
│   │   │   │   │   ├── CatAnimation2.json
│   │   │   │   │   ├── CatAnimation3.json
│   │   │   │   │   ├── CatAnimation4.json
│   │   │   │   │   ├── CatAnimation5.json
│   │   │   │   │   ├── ChillingVibes.json
│   │   │   │   │   ├── HangingBuddy.json
│   │   │   │   │   ├── NoResultsFound.json
│   │   │   │   │   ├── SearchNotFound.json
│   │   │   │   ├── NoChat.js
│   │   ├── components/
│   │   │   ├── animate/
│   │   │   │   ├── varients/
│   │   │   │   │   ├── actions.js
│   │   │   │   │   ├── background.js
│   │   │   │   │   ├── bounce.js
│   │   │   │   │   ├── container.js
│   │   │   │   │   ├── fade.js
│   │   │   │   │   ├── flip.js
│   │   │   │   │   ├── index.js
│   │   │   │   │   ├── path.js
│   │   │   │   │   ├── rotate.js
│   │   │   │   │   ├── scale.js
│   │   │   │   │   ├── slide.js
│   │   │   │   │   ├── transition.js
│   │   │   │   │   ├── zoom.js
│   │   │   │   ├── DialogAnimate.js
│   │   │   │   ├── FabButtonAnimate.js
│   │   │   │   ├── features.js
│   │   │   │   ├── IconButtonAnimate.js
│   │   │   │   ├── index.js
│   │   │   │   ├── MotionContainer.js
│   │   │   │   ├── MotionLazyContainer.js
│   │   │   │   ├── MotionViewport.js
│   │   │   │   ├── TextAnimate.js
│   │   │   ├── hook-form/
│   │   │   │   ├── FormProvider.js
│   │   │   │   ├── index.js
│   │   │   │   ├── RHFOtp.js
│   │   │   │   ├── RHFTextField.js
│   │   │   │   ├── RHFUpload.js
│   │   │   ├── Image/
│   │   │   │   ├── getRatio.js
│   │   │   │   ├── Image.js
│   │   │   │   ├── index.js
│   │   │   ├── PageComponents/
│   │   │   │   ├── ContactPage/
│   │   │   │   │   ├── FriendsComponents/
│   │   │   │   │   │   ├── FriendsSubComps/
│   │   │   │   │   │   │   ├── index.js
│   │   │   │   │   │   │   ├── UserCard.js
│   │   │   │   │   │   │   ├── UsersSearchResults.js
│   │   │   │   │   │   ├── FriendRequests.js
│   │   │   │   │   │   ├── index.js
│   │   │   │   │   │   ├── SearchUsers.js
│   │   │   │   │   │   ├── SentRequests.js
│   │   │   │   │   ├── ContactList.js
│   │   │   │   │   ├── FriendsMenu.js
│   │   │   │   │   ├── index.js
│   │   │   │   ├── GeneralAppPage/
│   │   │   │   │   ├── ChatElements/
│   │   │   │   │   │   ├── AllChatElement.js
│   │   │   │   │   │   ├── ChatSearchResults.js
│   │   │   │   │   │   ├── OnlineChatElement.js
│   │   │   │   │   ├── ConversationElements/
│   │   │   │   │   │   ├── ConvoSubElements/
│   │   │   │   │   │   │   ├── ChatInput.js
│   │   │   │   │   │   │   ├── MessageContainer.js
│   │   │   │   │   │   ├── ConversationFooter.js
│   │   │   │   │   │   ├── ConversationHeader.js
│   │   │   │   │   │   ├── ConversationMain.js
│   │   │   │   │   │   ├── index.js
│   │   │   │   │   ├── ChatsList.js
│   │   │   │   │   ├── Conversation.js
│   │   │   │   │   ├── index.js
│   │   │   │   ├── OnlineFriendsElement/
│   │   │   │   │   ├── OnlineFriendsElement.js
│   │   │   │   ├── ProfilePage/
│   │   │   │   │   ├── ProfilePage.js
│   │   │   │   ├── UserProfileDrawer/
│   │   │   │   │   ├── UserDrawerComps/
│   │   │   │   │   │   ├── UDMainComps/
│   │   │   │   │   │   │   ├── RemoveFriendDialog.js
│   │   │   │   │   │   ├── index.js
│   │   │   │   │   │   ├── UserDrawerHeader.js
│   │   │   │   │   │   ├── UserDrawerMain.js
│   │   │   │   │   ├── UserProfileDrawer.js
│   │   │   ├── Search/
│   │   │   │   ├── index.js
│   │   │   │   ├── Search.js
│   │   │   │   ├── SearchIconWrapper.js
│   │   │   │   ├── StyledInputBase.js
│   │   │   ├── settings/
│   │   │   │   ├── drawer/
│   │   │   │   │   ├── BoxMask.js
│   │   │   │   │   ├── Developer.js
│   │   │   │   │   ├── index.js
│   │   │   │   │   ├── SettingColorPresets.js
│   │   │   │   │   ├── SettingContrast.js
│   │   │   │   │   ├── SettingDirection.js
│   │   │   │   │   ├── SettingFullscreen.js
│   │   │   │   │   ├── SettingLayout.js
│   │   │   │   │   ├── SettingMode.js
│   │   │   │   │   ├── SettingStretch.js
│   │   │   │   │   ├── ToggleButton.js
│   │   │   │   ├── index.js
│   │   │   │   ├── ThemeColorPresets.js
│   │   │   │   ├── ThemeContrast.js
│   │   │   │   ├── ThemeLocalization.js
│   │   │   │   ├── ThemeRtlLayout.js
│   │   │   ├── upload/
│   │   │   │   ├── preview/
│   │   │   │   │   ├── AvatarCropper.js
│   │   │   │   │   ├── AvatarPreview.js
│   │   │   │   │   ├── cropImage.js
│   │   │   │   ├── index.js
│   │   │   │   ├── UploadAvatar.js
│   │   │   ├── AntSwitch.js
│   │   │   ├── Iconify.js
│   │   │   ├── LoadingScreen.js
│   │   │   ├── NoData.js
│   │   │   ├── StyledBadge.js
│   │   │   ├── ThemeSwitch.js
│   │   ├── contexts/
│   │   │   ├── SettingsContext.js
│   │   ├── data/
│   │   │   ├── index.js
│   │   ├── hooks/
│   │   │   ├── useLocales.js
│   │   │   ├── useLocalStorage.js
│   │   │   ├── useResponsive.js
│   │   │   ├── useSettings.js
│   │   ├── layouts/
│   │   │   ├── auth/
│   │   │   │   ├── index.js
│   │   │   ├── dashboard/
│   │   │   │   ├── index.js
│   │   │   │   ├── Sidebar.js
│   │   │   ├── docs/
│   │   │   │   ├── index.js
│   │   ├── pages/
│   │   │   ├── auth/
│   │   │   │   ├── ForgotPassword.js
│   │   │   │   ├── Login.js
│   │   │   │   ├── Register.js
│   │   │   │   ├── ResetPassword.js
│   │   │   │   ├── Verify.js
│   │   │   │   ├── WelcomePage.js
│   │   │   ├── dashboard/
│   │   │   │   ├── Contact.js
│   │   │   │   ├── GeneralApp.js
│   │   │   │   ├── GroupChat.js
│   │   │   │   ├── Profile.js
│   │   │   │   ├── Settings.js
│   │   │   ├── docs/
│   │   │   │   ├── TnC.js
│   │   │   ├── 404.js
│   │   ├── redux/
│   │   │   ├── slices/
│   │   │   │   ├── actions/
│   │   │   │   │   ├── authActions.js
│   │   │   │   │   ├── chatActions.js
│   │   │   │   │   ├── contactActions.js
│   │   │   │   │   ├── userActions.js
│   │   │   │   ├── authSlice.js
│   │   │   │   ├── chatSlice.js
│   │   │   │   ├── contactSlice.js
│   │   │   │   ├── index.js
│   │   │   │   ├── userSlice.js
│   │   │   ├── rootReducer.js
│   │   │   ├── store.js
│   │   ├── routes/
│   │   │   ├── index.js
│   │   │   ├── paths.js
│   │   ├── sections/
│   │   │   ├── auth/
│   │   │   │   ├── AuthSocial.js
│   │   │   │   ├── ForgotPasswordForm.js
│   │   │   │   ├── LoginForm.js
│   │   │   │   ├── RegisterForm.js
│   │   │   │   ├── ResetPasswordForm.js
│   │   │   │   ├── VerifyForm.js
│   │   │   ├── settings/
│   │   │   │   ├── ProfileForm.js
│   │   │   │   ├── Shortcuts.js
│   │   │   │   ├── ThemeDialog.js
│   │   ├── theme/
│   │   │   ├── overrides/
│   │   │   │   ├── Accordion.js
│   │   │   │   ├── Alert.js
│   │   │   │   ├── Autocomplete.js
│   │   │   │   ├── Avatar.js
│   │   │   │   ├── Backdrop.js
│   │   │   │   ├── Badge.js
│   │   │   │   ├── Breadcrumbs.js
│   │   │   │   ├── Button.js
│   │   │   │   ├── ButtonGroup.js
│   │   │   │   ├── Card.js
│   │   │   │   ├── Checkbox.js
│   │   │   │   ├── Chip.js
│   │   │   │   ├── ControlLabel.js
│   │   │   │   ├── CssBaseline.js
│   │   │   │   ├── CustomIcons.js
│   │   │   │   ├── DataGrid.js
│   │   │   │   ├── Dialog.js
│   │   │   │   ├── Drawer.js
│   │   │   │   ├── Fab.js
│   │   │   │   ├── index.js
│   │   │   │   ├── Input.js
│   │   │   │   ├── Link.js
│   │   │   │   ├── List.js
│   │   │   │   ├── LoadingButton.js
│   │   │   │   ├── Menu.js
│   │   │   │   ├── Pagination.js
│   │   │   │   ├── Paper.js
│   │   │   │   ├── Popover.js
│   │   │   │   ├── Progress.js
│   │   │   │   ├── Radio.js
│   │   │   │   ├── Rating.js
│   │   │   │   ├── Select.js
│   │   │   │   ├── Skeleton.js
│   │   │   │   ├── Slider.js
│   │   │   │   ├── Stepper.js
│   │   │   │   ├── SvgIcon.js
│   │   │   │   ├── Switch.js
│   │   │   │   ├── Table.js
│   │   │   │   ├── Tabs.js
│   │   │   │   ├── Timeline.js
│   │   │   │   ├── ToggleButton.js
│   │   │   │   ├── Tooltip.js
│   │   │   │   ├── TreeView.js
│   │   │   │   ├── Typography.js
│   │   │   ├── breakpoints.js
│   │   │   ├── index.js
│   │   │   ├── palette.js
│   │   │   ├── shadows.js
│   │   │   ├── typography.js
│   │   ├── utils/
│   │   │   ├── axios.js
│   │   │   ├── axiosInterceptors.js
│   │   │   ├── createAvatar.js
│   │   │   ├── cssStyles.js
│   │   │   ├── flattenArray.js
│   │   │   ├── formatNumber.js
│   │   │   ├── formatTime.js
│   │   │   ├── getColorName.js
│   │   │   ├── getColorPresets.js
│   │   │   ├── getFileData.js
│   │   │   ├── getFontValue.js
│   │   │   ├── getOtherUser.js
│   │   │   ├── helmetHandler.js
│   │   │   ├── jwt.js
│   │   │   ├── scrollToBottom.js
│   │   │   ├── socialLoginHelpers.js
│   │   │   ├── socket.js
│   │   │   ├── timeFormatter.js
│   │   │   ├── truncateText.js
│   │   │   ├── uuidv4.js
│   │   ├── App.js
│   │   ├── config.js
│   │   ├── index.css
│   │   ├── index.js
│   ├── .env copy
│   ├── package-lock.json
│   ├── package.json
│   ├── README.md
```
</details>
<br/>

<div align="center">
<img src="https://komarev.com/ghpvc/?username=itsvaibhavmishra&&style=for-the-badge" align="center" />
</div>

<br/>

---
