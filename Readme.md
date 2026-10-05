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

    - Security options (rate limits on each route, XSS Protection, Sanitization, URL Encoding & more)

    - Dynamic server & routes error handling

    - Dedicted folder structure

    - JWT Middlewares for both APIs & Socket based requests

    - Cloudinary file upload system with auto folder structuring

    - Short-lived access tokens with a rotating, revocable session cookie

    - Structured DB with pre save & validations

    - And much more

<b>Frontend:</b>

    - Custom axios setup for easier API calling

    - Custom error interceptors for axios error handlings

    - Redux toolkit with persist

    - Custom hooks

    - Silent session refresh shared by every request and the socket

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
├── .github/
│   ├── ...
├──backend/
│   ├── ...
├── docs/
│   ├── development.md
├──frontend/
│   ├── ...
├── scripts/
│   ├── ...
├── .gitattributes
├── .gitignore
├── CHANGELOG.md
├── devlog.txt
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
│   │   │   ├── groupController.js
│   │   │   ├── keyController.js
│   │   │   ├── messageController.js
│   │   │   ├── passkeyController.js
│   │   │   ├── socialController.js
│   │   │   ├── userController.js
│   │   ├── middlewares/
│   │   │   ├── authMiddleware.js
│   │   │   ├── rateLimiters.js
│   │   │   ├── recaptchaMiddleware.js
│   │   │   ├── socketMiddleware.js
│   │   │   ├── socketRateLimit.js
│   │   ├── models/
│   │   │   ├── conversationModel.js
│   │   │   ├── friendRequestModel.js
│   │   │   ├── index.js
│   │   │   ├── messageModel.js
│   │   │   ├── passkeyChallengeModel.js
│   │   │   ├── passkeyModel.js
│   │   │   ├── sessionModel.js
│   │   │   ├── userModel.js
│   │   ├── routes/
│   │   │   ├── authRouter.js
│   │   │   ├── conversationRouter.js
│   │   │   ├── friendsRouter.js
│   │   │   ├── groupRouter.js
│   │   │   ├── index.js
│   │   │   ├── keyRouter.js
│   │   │   ├── messageRouter.js
│   │   │   ├── passkeyRouter.js
│   │   │   ├── userRouter.js
│   │   ├── services/
│   │   │   ├── authService.js
│   │   │   ├── conversationService.js
│   │   │   ├── fileUploadService.js
│   │   │   ├── friendsService.js
│   │   │   ├── groupService.js
│   │   │   ├── keyService.js
│   │   │   ├── mailer.js
│   │   │   ├── messageService.js
│   │   │   ├── passkeyService.js
│   │   │   ├── sessionService.js
│   │   │   ├── socialAuthService.js
│   │   │   ├── userService.js
│   │   ├── templates/
│   │   │   ├── mail/
│   │   │   │   ├── otp.js
│   │   │   │   ├── reset.js
│   │   ├── utils/
│   │   │   ├── accountRules.js
│   │   │   ├── checkDispose.js
│   │   │   ├── escapeRegex.js
│   │   │   ├── sha256.js
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
│   │   ├── sounds/
│   │   │   ├── elsewhere.mp3
│   │   │   ├── received.mp3
│   │   │   ├── sent.mp3
│   │   ├── _redirects
│   │   ├── apple-touch-icon.png
│   │   ├── favicon.ico
│   │   ├── icon-192.png
│   │   ├── icon-512.png
│   │   ├── index.html
│   │   ├── manifest.json
│   │   ├── og-image.png
│   │   ├── robots.txt
│   │   ├── sitemap.txt
│   │   ├── sitemap.xml
│   ├── src/
│   │   ├── assets/
│   │   │   ├── backgrounds/
│   │   │   │   ├── catDoodle.png
│   │   │   │   ├── catDoodle.webp
│   │   │   │   ├── catDoodle2.png
│   │   │   │   ├── catDoodle3.png
│   │   │   ├── icons/
│   │   │   │   ├── logo/
│   │   │   │   │   ├── Whisprl.png
│   │   │   │   │   ├── Whisprl.webp
│   │   │   │   │   ├── WhisprlAvatar.webp
│   │   │   │   │   ├── WhisprlMark.webp
│   │   │   ├── illustrations/
│   │   │   │   ├── animations/
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
│   │   │   │   ├── variants/
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
│   │   │   │   ├── PasswordChecklist.js
│   │   │   │   ├── RHFOtp.js
│   │   │   │   ├── RHFPasswordField.js
│   │   │   │   ├── RHFTextField.js
│   │   │   ├── image-cropper/
│   │   │   │   ├── cropImage.js
│   │   │   │   ├── ImageCropper.js
│   │   │   ├── search/
│   │   │   │   ├── index.js
│   │   │   │   ├── Search.js
│   │   │   │   ├── SearchIconWrapper.js
│   │   │   │   ├── StyledInputBase.js
│   │   │   ├── theme-settings/
│   │   │   │   ├── index.js
│   │   │   │   ├── ThemeColorPresets.js
│   │   │   │   ├── ThemeLocalization.js
│   │   │   │   ├── ThemeRtlLayout.js
│   │   │   ├── AppearanceMenu.js
│   │   │   ├── AppearancePickers.js
│   │   │   ├── ImageMenu.js
│   │   │   ├── LoadingScreen.js
│   │   │   ├── NoData.js
│   │   │   ├── OnlineFriendsElement.js
│   │   │   ├── ProfileHero.js
│   │   │   ├── ScrollToTop.js
│   │   │   ├── SitePage.js
│   │   │   ├── StyledBadge.js
│   │   │   ├── ThemeSwitch.js
│   │   ├── contexts/
│   │   │   ├── SettingsContext.js
│   │   ├── data/
│   │   │   ├── index.js
│   │   ├── hooks/
│   │   │   ├── useFileUrl.js
│   │   │   ├── useIsLoading.js
│   │   │   ├── useLocales.js
│   │   │   ├── useLocalStorage.js
│   │   │   ├── useResponsive.js
│   │   │   ├── useSettings.js
│   │   ├── layouts/
│   │   │   ├── auth/
│   │   │   │   ├── BrandPanel.js
│   │   │   │   ├── index.js
│   │   │   ├── dashboard/
│   │   │   │   ├── DashboardPage.js
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
│   │   │   │   ├── Profile.js
│   │   │   │   ├── Settings.js
│   │   │   ├── docs/
│   │   │   │   ├── TnC.js
│   │   │   ├── 404.js
│   │   ├── redux/
│   │   │   ├── slices/
│   │   │   │   ├── actions/
│   │   │   │   │   ├── apiThunk.js
│   │   │   │   │   ├── attachmentActions.js
│   │   │   │   │   ├── authActions.js
│   │   │   │   │   ├── chatActions.js
│   │   │   │   │   ├── contactActions.js
│   │   │   │   │   ├── encryptionActions.js
│   │   │   │   │   ├── groupActions.js
│   │   │   │   │   ├── passkeyActions.js
│   │   │   │   │   ├── socketActions.js
│   │   │   │   │   ├── userActions.js
│   │   │   │   ├── authSlice.js
│   │   │   │   ├── chatSlice.js
│   │   │   │   ├── contactSlice.js
│   │   │   │   ├── encryptionSlice.js
│   │   │   │   ├── index.js
│   │   │   │   ├── requestSlice.js
│   │   │   │   ├── requestSlice.test.js
│   │   │   │   ├── userSlice.js
│   │   │   ├── rootReducer.js
│   │   │   ├── rootReducer.test.js
│   │   │   ├── store.js
│   │   ├── routes/
│   │   │   ├── index.js
│   │   │   ├── paths.js
│   │   ├── sections/
│   │   │   ├── auth/
│   │   │   │   ├── AuthHeader.js
│   │   │   │   ├── AuthSocial.js
│   │   │   │   ├── ForgotPasswordForm.js
│   │   │   │   ├── LoginForm.js
│   │   │   │   ├── RegisterForm.js
│   │   │   │   ├── ResetPasswordForm.js
│   │   │   │   ├── VerifyForm.js
│   │   │   ├── chat/
│   │   │   │   ├── attachments/
│   │   │   │   │   ├── FileBody.js
│   │   │   │   │   ├── FileFooter.js
│   │   │   │   │   ├── FileHeader.js
│   │   │   │   │   ├── FileUploadCont.js
│   │   │   │   ├── conversation/
│   │   │   │   │   ├── ChatInput.js
│   │   │   │   │   ├── Conversation.js
│   │   │   │   │   ├── ConversationFooter.js
│   │   │   │   │   ├── ConversationHeader.js
│   │   │   │   │   ├── ConversationMain.js
│   │   │   │   │   ├── useChatScroll.js
│   │   │   │   ├── group/
│   │   │   │   │   ├── AddMembersDialog.js
│   │   │   │   │   ├── CreateGroupDialog.js
│   │   │   │   │   ├── FriendPicker.js
│   │   │   │   │   ├── GroupInfoDrawer.js
│   │   │   │   │   ├── GroupMemberRow.js
│   │   │   │   ├── messages/
│   │   │   │   │   ├── DocumentMessage.js
│   │   │   │   │   ├── ImageLightbox.js
│   │   │   │   │   ├── ImageMessage.js
│   │   │   │   │   ├── MessageContainer.js
│   │   │   │   │   ├── MessageImage.js
│   │   │   │   │   ├── MessageProblems.js
│   │   │   │   │   ├── SeenMarker.js
│   │   │   │   ├── AllChatElement.js
│   │   │   │   ├── ChatSearchResults.js
│   │   │   │   ├── ChatsList.js
│   │   │   │   ├── OnlineChatElement.js
│   │   │   ├── contacts/
│   │   │   │   ├── ContactList.js
│   │   │   │   ├── FriendRequests.js
│   │   │   │   ├── FriendsMenu.js
│   │   │   │   ├── SearchUsers.js
│   │   │   │   ├── SentRequests.js
│   │   │   │   ├── UserCard.js
│   │   │   │   ├── UsersSearchResults.js
│   │   │   ├── encryption/
│   │   │   │   ├── EncryptionGate.js
│   │   │   │   ├── RecoveryKeyDialog.js
│   │   │   │   ├── UnlockDialog.js
│   │   │   ├── friend-drawer/
│   │   │   │   ├── RemoveFriendDialog.js
│   │   │   │   ├── UserDrawerMain.js
│   │   │   │   ├── UserProfileDrawer.js
│   │   │   ├── profile/
│   │   │   │   ├── AccountSummary.js
│   │   │   │   ├── ProfileEditor.js
│   │   │   ├── settings/
│   │   │   │   ├── ChangePasswordDialog.js
│   │   │   │   ├── ChatPreview.js
│   │   │   │   ├── PasskeySetting.js
│   │   │   │   ├── RecoveryKeySetting.js
│   │   │   │   ├── SettingsSection.js
│   │   │   ├── terms/
│   │   │   │   ├── content.js
│   │   │   ├── welcome/
│   │   │   │   ├── Closing.js
│   │   │   │   ├── content.js
│   │   │   │   ├── Faq.js
│   │   │   │   ├── Features.js
│   │   │   │   ├── Hero.js
│   │   │   │   ├── HeroConversation.js
│   │   │   │   ├── MernStack.js
│   │   │   │   ├── styles.js
│   │   │   │   ├── Wordmark.js
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
│   │   │   ├── crypto/
│   │   │   │   ├── deviceKeyStore.js
│   │   │   │   ├── encoding.js
│   │   │   │   ├── fileCipher.js
│   │   │   │   ├── fileCipher.test.js
│   │   │   │   ├── keys.js
│   │   │   │   ├── keyWrap.js
│   │   │   │   ├── messageCipher.js
│   │   │   │   ├── messageCipher.test.js
│   │   │   │   ├── recoveryKey.js
│   │   │   ├── attachments.js
│   │   │   ├── axios.js
│   │   │   ├── axiosInterceptors.js
│   │   │   ├── createAvatar.js
│   │   │   ├── formatMessageTime.js
│   │   │   ├── formatMessageTime.test.js
│   │   │   ├── formatTime.js
│   │   │   ├── formRules.js
│   │   │   ├── getColorPresets.js
│   │   │   ├── getFontValue.js
│   │   │   ├── getOtherUser.js
│   │   │   ├── groups.js
│   │   │   ├── helmetHandler.js
│   │   │   ├── messageFiles.js
│   │   │   ├── notify.js
│   │   │   ├── passkeys.js
│   │   │   ├── scrollToBottom.js
│   │   │   ├── socialLoginHelpers.js
│   │   │   ├── socket.js
│   │   │   ├── sounds.js
│   │   │   ├── truncateText.js
│   │   │   ├── uuidv4.js
│   │   ├── App.js
│   │   ├── config.js
│   │   ├── index.css
│   │   ├── index.js
│   ├── .env copy
│   ├── config-overrides.js
│   ├── jsconfig.json
│   ├── package-lock.json
│   ├── package.json
│   ├── README.md
```
</details>
<br/>

## 🔊 Sound credits

The message sounds in `frontend/public/sounds/` are trimmed and levelled versions of:

- `sent.mp3`: "navigation_forward-selection-minimal" from Google's [Material Design sound resources](https://m2.material.io/design/sound/sound-resources.html), under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)
- `received.mp3`: "completion-success" by Guilherme Marçal Silva, from KDE's [Ocean sound theme](https://invent.kde.org/plasma/ocean-sound-theme), under [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/)
- `elsewhere.mp3`: "message-new-instant" by Guilherme Marçal Silva, from KDE's [Ocean sound theme](https://invent.kde.org/plasma/ocean-sound-theme), under [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/)

The two from Ocean keep their CC BY-SA 4.0 licence in this form. The rest of Whisprl is CC0.

<div align="center">
<img src="https://komarev.com/ghpvc/?username=itsvaibhavmishra&&style=for-the-badge" align="center" />
</div>

<br/>

---
