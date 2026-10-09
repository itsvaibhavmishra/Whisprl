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

    - Short-lived access tokens, renewed by signing a fresh challenge with a key each browser keeps and cannot export, so no cookies

    - Structured DB with pre save & validations

    - And much more

<b>Frontend:</b>

    - Custom axios setup for easier API calling

    - Custom error interceptors for axios error handlings

    - Redux toolkit with persist

    - Custom hooks

    - Silent token renewal shared by every request and the socket

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
│   │   │   ├── chatSettingsController.js
│   │   │   ├── conversationController.js
│   │   │   ├── friendsController.js
│   │   │   ├── groupController.js
│   │   │   ├── keyController.js
│   │   │   ├── messageActionController.js
│   │   │   ├── messageController.js
│   │   │   ├── passkeyController.js
│   │   │   ├── safetyController.js
│   │   │   ├── socialController.js
│   │   │   ├── statusController.js
│   │   │   ├── userController.js
│   │   ├── middlewares/
│   │   │   ├── authMiddleware.js
│   │   │   ├── rateLimiters.js
│   │   │   ├── recaptchaMiddleware.js
│   │   │   ├── sessionKeyMiddleware.js
│   │   │   ├── socketMiddleware.js
│   │   │   ├── socketRateLimit.js
│   │   ├── models/
│   │   │   ├── albumModel.js
│   │   │   ├── chatPreferenceModel.js
│   │   │   ├── conversationModel.js
│   │   │   ├── friendRequestModel.js
│   │   │   ├── index.js
│   │   │   ├── messageModel.js
│   │   │   ├── passkeyChallengeModel.js
│   │   │   ├── passkeyModel.js
│   │   │   ├── reportModel.js
│   │   │   ├── requestCooldownModel.js
│   │   │   ├── sessionModel.js
│   │   │   ├── statusModel.js
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
│   │   │   ├── statusRouter.js
│   │   │   ├── userRouter.js
│   │   ├── services/
│   │   │   ├── albumService.js
│   │   │   ├── authService.js
│   │   │   ├── blockService.js
│   │   │   ├── chatPreferenceService.js
│   │   │   ├── conversationService.js
│   │   │   ├── disappearingService.js
│   │   │   ├── fileUploadService.js
│   │   │   ├── friendsService.js
│   │   │   ├── groupService.js
│   │   │   ├── keyService.js
│   │   │   ├── mailer.js
│   │   │   ├── messageActionService.js
│   │   │   ├── messageService.js
│   │   │   ├── passkeyService.js
│   │   │   ├── reportService.js
│   │   │   ├── requestCooldownService.js
│   │   │   ├── sessionService.js
│   │   │   ├── socialAuthService.js
│   │   │   ├── statusService.js
│   │   │   ├── suggestionService.js
│   │   │   ├── userService.js
│   │   │   ├── usernameService.js
│   │   ├── templates/
│   │   │   ├── mail/
│   │   │   │   ├── otp.js
│   │   │   │   ├── reset.js
│   │   ├── utils/
│   │   │   ├── accountRules.js
│   │   │   ├── checkDispose.js
│   │   │   ├── coverStyles.js
│   │   │   ├── escapeRegex.js
│   │   │   ├── sha256.js
│   ├── .env copy
│   ├── app.js
│   ├── jsconfig.json
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
│   │   │   │   ├── chatDoodles.svg
│   │   │   ├── covers/
│   │   │   │   ├── cats.svg
│   │   │   │   ├── sky.svg
│   │   │   │   ├── whispers.svg
│   │   │   ├── icons/
│   │   │   │   ├── logo/
│   │   │   │   │   ├── Whisprl.png
│   │   │   │   │   ├── Whisprl.webp
│   │   │   │   │   ├── WhisprlAvatar.webp
│   │   │   │   │   ├── WhisprlMark.webp
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
│   │   │   ├── media-editor/
│   │   │   │   ├── FilterStrip.js
│   │   │   │   ├── LayerView.js
│   │   │   │   ├── MediaEditor.js
│   │   │   │   ├── MentionPicker.js
│   │   │   │   ├── Stage.js
│   │   │   │   ├── TextEditor.js
│   │   │   │   ├── ToolControls.js
│   │   │   │   ├── ToolSheet.js
│   │   │   │   ├── useStageGestures.js
│   │   │   ├── profile/
│   │   │   │   ├── CommonGroups.js
│   │   │   │   ├── ProfileFacts.js
│   │   │   │   ├── ProfileIdentity.js
│   │   │   │   ├── ProfileSheet.js
│   │   │   │   ├── ProfileView.js
│   │   │   │   ├── RelationshipActions.js
│   │   │   │   ├── RequestButton.js
│   │   │   │   ├── RequestComposer.js
│   │   │   │   ├── RequestNote.js
│   │   │   │   ├── SafetyRows.js
│   │   │   ├── theme-settings/
│   │   │   │   ├── index.js
│   │   │   │   ├── ThemeColorPresets.js
│   │   │   │   ├── ThemeLocalization.js
│   │   │   │   ├── ThemeRtlLayout.js
│   │   │   ├── AppearanceMenu.js
│   │   │   ├── AppearancePickers.js
│   │   │   ├── ConfirmDialog.js
│   │   │   ├── ControlRow.js
│   │   │   ├── EmojiPicker.js
│   │   │   ├── FriendPicker.js
│   │   │   ├── ImageMenu.js
│   │   │   ├── LoadingScreen.js
│   │   │   ├── MascotHalo.js
│   │   │   ├── NoData.js
│   │   │   ├── Pane.js
│   │   │   ├── ProfileCover.js
│   │   │   ├── ReportDialog.js
│   │   │   ├── ScrollToTop.js
│   │   │   ├── SearchPill.js
│   │   │   ├── SitePage.js
│   │   │   ├── StatusArcs.js
│   │   │   ├── StyledBadge.js
│   │   │   ├── TypingDots.js
│   │   │   ├── Wordmark.js
│   │   ├── contexts/
│   │   │   ├── SettingsContext.js
│   │   ├── hooks/
│   │   │   ├── useFileUrl.js
│   │   │   ├── useFittedSize.js
│   │   │   ├── useHasSettled.js
│   │   │   ├── useImageBitmap.js
│   │   │   ├── useInfiniteScroll.js
│   │   │   ├── useIsLoading.js
│   │   │   ├── useLocales.js
│   │   │   ├── useLocalStorage.js
│   │   │   ├── useMessageTime.js
│   │   │   ├── useObjectUrl.js
│   │   │   ├── useOpenChat.js
│   │   │   ├── useRelationship.js
│   │   │   ├── useResponsive.js
│   │   │   ├── useSettings.js
│   │   ├── layouts/
│   │   │   ├── auth/
│   │   │   │   ├── BrandPanel.js
│   │   │   │   ├── index.js
│   │   │   ├── dashboard/
│   │   │   │   ├── DashboardPage.js
│   │   │   │   ├── index.js
│   │   │   │   ├── NavRail.js
│   │   │   │   ├── ProfileMenu.js
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
│   │   │   │   ├── Chat.js
│   │   │   │   ├── Contacts.js
│   │   │   │   ├── Profile.js
│   │   │   │   ├── Settings.js
│   │   │   │   ├── Status.js
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
│   │   │   │   │   ├── chatSettingsActions.js
│   │   │   │   │   ├── contactActions.js
│   │   │   │   │   ├── encryptionActions.js
│   │   │   │   │   ├── groupActions.js
│   │   │   │   │   ├── messageActions.js
│   │   │   │   │   ├── passkeyActions.js
│   │   │   │   │   ├── socketActions.js
│   │   │   │   │   ├── statusActions.js
│   │   │   │   │   ├── userActions.js
│   │   │   │   ├── authSlice.js
│   │   │   │   ├── chatSlice.js
│   │   │   │   ├── contactSlice.js
│   │   │   │   ├── encryptionSlice.js
│   │   │   │   ├── index.js
│   │   │   │   ├── requestSlice.js
│   │   │   │   ├── requestSlice.test.js
│   │   │   │   ├── statusSlice.js
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
│   │   │   │   │   ├── FileUploadCont.js
│   │   │   │   ├── conversation/
│   │   │   │   │   ├── AttachMenu.js
│   │   │   │   │   ├── ChatNote.js
│   │   │   │   │   ├── ChatSearchBar.js
│   │   │   │   │   ├── Composer.js
│   │   │   │   │   ├── Conversation.js
│   │   │   │   │   ├── ConversationHeader.js
│   │   │   │   │   ├── ConversationMain.js
│   │   │   │   │   ├── displayItems.js
│   │   │   │   │   ├── displayItems.test.js
│   │   │   │   │   ├── MentionSuggestions.js
│   │   │   │   │   ├── PinnedBar.js
│   │   │   │   │   ├── ShareContactDialog.js
│   │   │   │   │   ├── useChatScroll.js
│   │   │   │   │   ├── useFloatingDayLabels.js
│   │   │   │   │   ├── useTyping.js
│   │   │   │   │   ├── VoiceRecorder.js
│   │   │   │   ├── details/
│   │   │   │   │   ├── ChatControls.js
│   │   │   │   │   ├── DetailsPanel.js
│   │   │   │   │   ├── DetailsSection.js
│   │   │   │   │   ├── GroupDetails.js
│   │   │   │   │   ├── HaloAvatar.js
│   │   │   │   │   ├── PersonDetails.js
│   │   │   │   │   ├── PhotoViewer.js
│   │   │   │   │   ├── QuickActions.js
│   │   │   │   │   ├── SharedContent.js
│   │   │   │   ├── group/
│   │   │   │   │   ├── AddMembersDialog.js
│   │   │   │   │   ├── CreateGroupDialog.js
│   │   │   │   │   ├── GroupMemberRow.js
│   │   │   │   ├── list/
│   │   │   │   │   ├── ChatList.js
│   │   │   │   │   ├── ChatRow.js
│   │   │   │   ├── messages/
│   │   │   │   │   ├── ContactCard.js
│   │   │   │   │   ├── DeleteMessageDialog.js
│   │   │   │   │   ├── DocumentMessage.js
│   │   │   │   │   ├── ForwardDialog.js
│   │   │   │   │   ├── MediaMessage.js
│   │   │   │   │   ├── MediaTile.js
│   │   │   │   │   ├── MessageActions.js
│   │   │   │   │   ├── MessageContainer.js
│   │   │   │   │   ├── MessageImage.js
│   │   │   │   │   ├── MessageMeta.js
│   │   │   │   │   ├── MessageProblems.js
│   │   │   │   │   ├── MessageText.js
│   │   │   │   │   ├── ReactionList.js
│   │   │   │   │   ├── ReactionPicker.js
│   │   │   │   │   ├── Reactions.js
│   │   │   │   │   ├── ReplyQuote.js
│   │   │   │   │   ├── SeenMarker.js
│   │   │   │   │   ├── StatusQuote.js
│   │   │   │   │   ├── TransferRing.js
│   │   │   │   │   ├── TypingBubble.js
│   │   │   │   │   ├── useSwipeToReply.js
│   │   │   │   │   ├── VideoMessage.js
│   │   │   │   │   ├── ViewOnceMessage.js
│   │   │   │   │   ├── ViewOnceViewer.js
│   │   │   │   │   ├── VoiceMessage.js
│   │   │   │   │   ├── Waveform.js
│   │   │   │   ├── status/
│   │   │   │   │   ├── AvatarChoices.js
│   │   │   │   │   ├── useLiveStatuses.js
│   │   │   │   ├── viewer/
│   │   │   │   │   ├── Filmstrip.js
│   │   │   │   │   ├── mediaItems.js
│   │   │   │   │   ├── MediaViewer.js
│   │   │   │   │   ├── useFlight.js
│   │   │   │   │   ├── ViewerActions.js
│   │   │   │   │   ├── ViewerSlide.js
│   │   │   │   │   ├── viewerTheme.js
│   │   │   │   ├── wallpaper/
│   │   │   │   │   ├── WallpaperChoices.js
│   │   │   │   │   ├── WallpaperDialog.js
│   │   │   │   │   ├── wallpapers.js
│   │   │   │   ├── ChatAvatar.js
│   │   │   │   ├── ChatCanvas.js
│   │   │   │   ├── EmptyChat.js
│   │   │   │   ├── chatRoute.js
│   │   │   ├── contacts/
│   │   │   │   ├── ContactsList.js
│   │   │   │   ├── EveryoneResults.js
│   │   │   │   ├── FindPeople.js
│   │   │   │   ├── PersonPane.js
│   │   │   │   ├── PersonRow.js
│   │   │   │   ├── ProfilePass.js
│   │   │   │   ├── RequestsView.js
│   │   │   │   ├── contactsRoute.js
│   │   │   ├── encryption/
│   │   │   │   ├── EncryptionGate.js
│   │   │   │   ├── RecoveryKeyDialog.js
│   │   │   │   ├── UnlockDialog.js
│   │   │   ├── profile/
│   │   │   │   ├── AccountSummary.js
│   │   │   │   ├── CoverPicker.js
│   │   │   │   ├── ProfileEditor.js
│   │   │   ├── settings/
│   │   │   │   ├── BlockedPeopleSetting.js
│   │   │   │   ├── ChangePasswordDialog.js
│   │   │   │   ├── ChatPreview.js
│   │   │   │   ├── PasskeySetting.js
│   │   │   │   ├── QuickReactionsSetting.js
│   │   │   │   ├── RecoveryKeySetting.js
│   │   │   │   ├── SettingsSection.js
│   │   │   │   ├── StatusPrivacySetting.js
│   │   │   │   ├── SuggestionsSetting.js
│   │   │   │   ├── UsernameSetting.js
│   │   │   │   ├── WallpaperSetting.js
│   │   │   ├── status/
│   │   │   │   ├── AudienceDialog.js
│   │   │   │   ├── DeleteUpdateDialog.js
│   │   │   │   ├── DiscoverGrid.js
│   │   │   │   ├── EveryonePill.js
│   │   │   │   ├── NewUpdateMenu.js
│   │   │   │   ├── ReplyBar.js
│   │   │   │   ├── SeenBy.js
│   │   │   │   ├── ShareStatusDialog.js
│   │   │   │   ├── StatusComposer.js
│   │   │   │   ├── StatusHeader.js
│   │   │   │   ├── StatusList.js
│   │   │   │   ├── StatusMedia.js
│   │   │   │   ├── StatusSlide.js
│   │   │   │   ├── StatusViewer.js
│   │   │   │   ├── YourUpdates.js
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
│   │   │   │   ├── encoding.js
│   │   │   │   ├── fileCipher.js
│   │   │   │   ├── fileCipher.test.js
│   │   │   │   ├── keys.js
│   │   │   │   ├── keyStore.js
│   │   │   │   ├── keyWrap.js
│   │   │   │   ├── messageCipher.js
│   │   │   │   ├── messageCipher.test.js
│   │   │   │   ├── noteCipher.js
│   │   │   │   ├── noteCipher.test.js
│   │   │   │   ├── recoveryKey.js
│   │   │   │   ├── sessionKeys.js
│   │   │   │   ├── sessionKeys.test.js
│   │   │   │   ├── statusCipher.js
│   │   │   │   ├── statusCipher.test.js
│   │   │   ├── media-editor/
│   │   │   │   ├── draw.js
│   │   │   │   ├── filters.js
│   │   │   │   ├── fonts.js
│   │   │   │   ├── layout.js
│   │   │   │   ├── palette.js
│   │   │   │   ├── render.js
│   │   │   ├── attachments.js
│   │   │   ├── avatars.js
│   │   │   ├── axios.js
│   │   │   ├── chats.js
│   │   │   ├── chats.test.js
│   │   │   ├── colorPresets.js
│   │   │   ├── covers.js
│   │   │   ├── formatMessageTime.js
│   │   │   ├── formatMessageTime.test.js
│   │   │   ├── formatTime.js
│   │   │   ├── formRules.js
│   │   │   ├── formRules.test.js
│   │   │   ├── getFontValue.js
│   │   │   ├── getOtherUser.js
│   │   │   ├── gradients.js
│   │   │   ├── groups.js
│   │   │   ├── heldReactions.js
│   │   │   ├── heldReactions.test.js
│   │   │   ├── helmetHandler.js
│   │   │   ├── links.js
│   │   │   ├── links.test.js
│   │   │   ├── messageFiles.js
│   │   │   ├── messageFiles.test.js
│   │   │   ├── messagePayload.js
│   │   │   ├── messageSummary.js
│   │   │   ├── messageSummary.test.js
│   │   │   ├── notifications.js
│   │   │   ├── notify.js
│   │   │   ├── passkeys.js
│   │   │   ├── reactions.js
│   │   │   ├── relationship.js
│   │   │   ├── relationship.test.js
│   │   │   ├── scrollToBottom.js
│   │   │   ├── session.js
│   │   │   ├── socialLoginHelpers.js
│   │   │   ├── socket.js
│   │   │   ├── sounds.js
│   │   │   ├── spokenOnly.js
│   │   │   ├── statuses.js
│   │   │   ├── statuses.test.js
│   │   │   ├── truncateText.js
│   │   │   ├── uuidv4.js
│   │   │   ├── video.js
│   │   │   ├── voice.js
│   │   │   ├── voice.test.js
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
