# Changelog

All notable changes to Whisprl are recorded here. Each released version gets a dated
section, filled from `devlog.txt` at release time.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) loosely, and the
versioning is [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.1.0] - 2026-10-09

### New

- A reaction shows in the chat list, as “Bianca reacted ❤️ to …”, until the next message
- Log in with your username or your email, in the same box
- Choose who sees each status update as you share it: all friends, all but some, or only a few, starting from your Settings choice
- Make a status like a story: text in eight fonts with colours, sizes and backgrounds, emoji and @mention stickers, pen, marker, neon and eraser brushes, gradient backgrounds and city filters, and drag, pinch, turn or bin anything you place
- Add text, stickers and drawing to each photo or video before you send it in a chat
- Tap a mention in someone's status to open that person's profile
- Reply to a friend's status or send a quick reaction; a reply lands in your chat quoting it, and your own status shows who reacted
- A friend you mention in a status gets a message about it
- Your own updates have a view of their own, with views and reactions on each: beside the list on a computer, a screen of its own on a phone
- Updates play full screen with a pause button (or space, or a long press), rarer actions behind ⋯, reactions when you ask for them, who saw your update one tap away, and the people before and after it on a wide screen
- Move and zoom the photo inside a status, and resize or turn text and stickers from the keyboard
- Share a status with everyone on Whisprl; friends see it as usual, and anyone else finds it in Discover, beside the list on a computer or as a screen of its own on a phone
- React to an update shared with everyone, open its owner's profile from it, or report it
- Send an update shared with everyone to friends, as a card in their chat that opens it while it lasts
- Add a short message to a friend request, so they know who is asking; it stays end-to-end encrypted and becomes the first message of your chat once they accept
- Every profile gets a doodle cover, Cats, Whispers or Night sky, in one of the accent colours; existing accounts get one too
- Choose your cover's pattern and colour, or shuffle them, from Edit cover on your profile; a photo still works, and removing it brings your pattern back
- One profile everywhere: from contacts, search, a shared contact or a status it opens the same view, with Message, Accept or Decline beside their note, Add friend with a note, or Cancel request
- Profiles show the friends you share, to friends and to people who asked you, and the groups you are both in
- Report someone you have no chat with, straight from their profile
- A new Contacts page: Requests above your friends from A to Z, with a search for your friends, and more friends showing as you scroll; requests and profiles open beside the list on a computer and as screens of their own on a phone
- Every profile has its own address, /contacts/@username, and Share profile copies it or opens your phone's share sheet
- Someone's update shared with everyone shows on their photo when you find them in Find people
- Find people in Contacts: search everyone on Whisprl by name or @username in one list, closest matches first, friends with Message and everyone else with Add friend, loading more as you scroll; see people you may know from the friends you share or a group you're both in, each with Add friend or Hide; and share your own card with a QR code and a link
- A search in your friends list that finds no friend offers Search everyone, which carries your words over to Find people
- Choose whether friends of your friends can find you in their suggestions, in Settings under Contacts; it starts on, and people in your groups can always find you there
- Sign up asks for your birthday, and your profile lets you add or change it; friends see the day and month, never the year, with a 🎂 beside your name on the day
- Hide your birthday from friends in Settings under Contacts; it starts shown
- Birthdays this week in Contacts, with a way to wish a friend on the day
- Undo a declined request for a few seconds before it is sent
- Change your username from your profile, as well as from Settings
- A setup screen after logging in asks for anything your account is missing before you carry on: a birthday for accounts that never gave one, along with who sees it and whether friends of friends can find you, your username to keep or change, a recovery key you download or copy before going on, with three good places to keep it, a recommended passkey you can skip, with help for a computer, an iPhone or an Android phone, and for a new account a photo and a bio; you can always log out from it
- What's new pops up over your chats once per release with its highlights, for anyone who was already here, and Settings keeps them all

### Improvements

- Your photo on the side rail opens Settings, with Log out at the bottom of its list
- The bar at the bottom of a phone matches the side rail: Chats, Status, Contacts, and your photo opening Settings, where a phone also has the light and dark switch
- Contacts shows how many friend requests are waiting, the moment one arrives
- Your email stays private: nobody else on Whisprl can see it or find you by it, and search goes by name or username
- Mentioning someone in a group inserts their @username, and suggestions match usernames as well as names
- Every scrolling area uses the chat's thin scrollbar, which shows while the pointer is over it
- Friend requests update live for both people: a new request, an accept, a cancel or a removed friend shows at once without a reload
- After a request is declined, you can ask the same person again after 24 hours
- The sender of a request cannot tell whether it was read until it is accepted
- The line beside your photo is now called your bio; it is optional, and the old default line is gone from every profile
- Chat details show the person's cover and the same profile header
- A new 404 page with the mascot and a way back to your chats
- Lists, profiles and request cards line up on one edge, on a computer and a phone
- Contacts opens on Requests when someone is waiting, and on Find people when no one is
- A profile opened from a search, a suggestion or a request has a Back button to where you were, keeping your search
- Profiles open without jumping: when someone joined shows straight away, and what loads later arrives once, below the rest
- Friends of your friends see the friends you share on your profile, unless you turn suggestions off
- Someone who declined your request, or whose friendship ended, is never suggested to you again
- Contacts waits for your friends and requests before saying none are waiting, so a friend's profile never offers Add friend while it loads
- Settings is split into Appearance, Chats, Account, Security, Privacy and About Whisprl, with your profile above them and edited right there, each at its own address, beside the list on a computer and a screen of its own on a phone
- Adding a passkey that unlocks your messages asks for it once rather than twice, where the browser supports it
- Sign up never hints at the age Whisprl needs, and a refused sign up stays refused on that browser for a day rather than inviting another try

### Fixed

- Signing in with Google works again
- The chat list keeps up as things happen: ticks turn to delivered and seen, edits and deletions show at once, and reading a chat in one tab clears it in the others
- The change password dialog no longer shows two scrollbars of its own
- Clicking beside a status closes it
- Searching for people no longer shows whether someone who is not your friend is online
- Someone who is no longer your friend can no longer see you typing in your old chat
- Accounts made before encryption can now set it up
- Soft buttons and request notes show clearly in light mode, and a friend's initial no longer turns the accent colour
- Saving your profile straight after opening it no longer snaps the form back to what it said before
- A bio stands out on a profile sheet instead of blending into it
- Your profile counts the same friends as Contacts, leaving out accounts that no longer exist

### Developers

- What's new highlights are written in releases.json as work lands, and release prep stamps them with the version; release-ready fails while any are left unstamped
- One new dependency, qrcode.react, draws the QR code on your card; it brings no dependencies of its own
- The birthday field uses the MUI date picker, @mui/x-date-pickers with dayjs as its date library

### Internal

- The old cat doodle cover images are gone, about 950 KB lighter
- The old profile drawer and its five cat animations are gone
- Lottie is gone, with react-lottie and the last five animations

## [2.0.0] - 2026-10-07

### New

- Terms and conditions, in plain language
- Cover pictures, on a redesigned profile page that is the card your friends see
- A System theme that follows your device
- Change your password from settings
- Text messages are end-to-end encrypted, with a recovery key to open them on a new browser
- See when your message is sent, delivered and seen, with your friend's photo on the last one they read
- Tap a message to see when it was sent
- Send photos and documents, several at a time with a caption, end-to-end encrypted like messages
- Log in with a passkey, including approving a laptop from your phone
- A passkey can unlock your messages on a new browser, so the recovery key is only a fallback
- Messages show the moment you send them, and wait to go out if your connection drops
- Older messages load as you scroll up, and a button counts the new ones below and takes you back down
- A chat opens at the first message you have not read, under a line saying how many there are
- Group chats with up to 32 friends, end-to-end encrypted like every other message
- The person who makes a group owns it and chooses admins, who can rename it, change its photo and add people
- See who has read a group message, with each person's photo under the last one they read
- Sounds when you send a message and when one arrives, quieter in the chat you have open, with a switch in settings
- A redesigned chat page at /chat, in light and dark: your chats, the conversation and its details side by side, a navigation rail with Whisprl's mascot, and a fresh doodle pattern
- Reply to a message, and edit your own messages for 15 minutes after sending
- Delete a message for yourself, or for everyone in the chat
- React to messages, end-to-end encrypted, from a quick bar you can change in settings or with a double click or tap
- Pin up to three messages in a chat
- Forward messages, and share a friend's contact card
- Mention people in a group by typing @
- Search inside a chat, and jump straight to any result, reply or pinned message
- See the photos, links and documents shared in a chat, and the groups you have in common with someone
- Everyone has a username, shown on their profile, which you can change in settings once every 30 days
- Search the chat page for chats and people by name, username or email, and add a friend straight from the results
- Mute a chat for 8 hours, a week or always, and get a notification for each new message while Whisprl is in the background
- Mark chats as favourites, and archive the ones you want out of the way
- Clear a chat for yourself, while everyone else keeps their messages
- Block someone so they can't message you or see when you're online, and report a person or a group
- Disappearing messages, deleted after 24 hours, 7 days or 90 days
- Send a photo that can be opened only once, deleted from storage as soon as it has been seen
- Send videos up to 3 minutes long, made smaller in your browser before they are encrypted and sent
- Send photos and videos together as one gallery, and swipe through them full screen
- A progress circle on photos and videos while they send, with a cancel button and Send again
- Videos can be sent view once too
- Status: share photos, videos and text with your friends for 24 hours, end-to-end encrypted, and see who viewed each one
- Choose friends to hide your status from in settings
- Swipe a message towards the middle of the chat to reply to it
- A 24-hour time setting, with times shown on the 12-hour clock by default
- Delete a chat for yourself: it leaves your list and its messages are cleared for you, until a new message brings it back
- Voice messages up to 15 minutes, end-to-end encrypted: hold the mic to record and let go to send, slide left to cancel, or slide up (or click, on a computer) to record hands-free
- Voice messages play at 1x, 1.5x or 2x, with a waveform that fills as they play and jumps to wherever you tap
- Each chat has its own address, so a refresh keeps it open and Back closes it, the details panel included
- Chat wallpapers to choose from, for every chat or just one, with the doodles on or off
- A Voice tab in a chat's details lists its voice messages

### Improvements

- The artwork loads several times faster, just as sharp
- A new welcome page: an example conversation, what Whisprl does, how it is built and the questions people ask
- Search results and shared links show a proper title, description and preview image for each page
- Redesigned log in, sign up, email verification and password reset pages
- Password fields show the rules as you type, and each has its own show button
- Redesigned settings, with a live preview of your theme and accent colour
- Pick your theme and accent colour from the welcome and log in pages
- One Whisprl logo everywhere, including the browser tab
- Messages to a friend who has not opened Whisprl since encryption arrived wait, then arrive once they do
- Stay logged in as long as you open Whisprl at least once every 90 days, after logging in once more with this update
- Long chats open quickly, starting from the newest messages
- Logging in and signing up are faster
- Each button and list shows its own loading state instead of every one at once
- A message that could not be sent stays where you wrote it, with the reason, Send again and Delete
- Messages go out in the order you wrote them, even when the connection is slow
- A photo keeps its place in the chat from the moment you send it, showing a blurred preview until it arrives
- Photos are made smaller before sending, so they send and load quickly
- Groups sit in Chats with everything else, replacing the empty Groups tab
- Switching between chats is instant
- Each chat shows how many messages are unread, and the list filters to unread chats or groups
- A session that has been logged out stops working straight away, rather than up to 15 minutes later
- A message you have started stays as a draft when you switch to another chat
- Whisprl's own doodles sit behind your messages
- The welcome page and the terms cover end-to-end encryption, group chats, videos and Status
- An edited message changes the moment you send it, and shows Sending… until it is saved
- A reply in a group shows the photo and name of the person it answers
- Messages show their time, and in one-to-one chats a tick for sent, delivered and seen, with a label for each day
- Your messages share one gradient that shifts as they scroll, new messages rise in, and the wallpaper drifts a little with each one you send
- The accent colours are now Halo, Violet, Lagoon, Cobalt, Sunset and Rose, each with a brighter shade for dark mode
- A letter avatar keeps the same colours wherever that person appears
- Dark mode is deeper and calmer, with the wallpaper's colours glowing through the doodles instead of washing over the chat
- Searching a chat highlights every match in the messages
- Voice messages are half the height, with the time beside their length
- The date floats over the messages only while you scroll, so it never covers one
- A friend's status shows as a ring around their photo in your chats, and their photo offers to open the status or their profile
- Your photo on the side rail opens your profile or settings
- Reactions sit in one pill under a message, showing up to three of the most used emoji and how many in all, and tapping it lists who reacted, reacts with the same emoji or takes yours back
- A long press or right click on a message opens quick reactions above its menu
- Your reaction is marked in the reaction picker, and changing it swaps it in place
- A message deleted for everyone can still be removed from your own screen
- Voice recording cancels or locks when you let go, so sliding back changes your mind
- Opening a chat's details eases the chat aside instead of jumping, and its close button sits on the right
- A new photo viewer that grows out of the photo you tap: react to, reply to, forward, save or delete each photo of a group on its own, zoom in, swipe between them, and drag down to close
- React to a group of photos as a whole or to each photo in it, with every reaction counted together on the group
- Deleting or forwarding a group of photos takes every photo in it, and a forwarded group arrives as one group
- A reply to a photo or video shows its thumbnail, and tapping it opens that photo and, once closed, shows it in the chat, or takes you to the group when the reply was to a whole group
- Choosing Reply always puts the cursor in the message box, including from the photo viewer
- A reply to a view-once photo or video quotes it in words only, and says Opened once it has been

### Fixed

- Opening a chat no longer crashes for people who used Whisprl before photo sharing arrived
- The terms link on the sign up page opens the terms rather than the log in page
- /docs opens the terms instead of a page that does not exist
- Following a link opens the next page at the top, not partway down
- Changing or resetting your password now logs out every other device
- Saving your profile no longer deletes your photo
- Other people can no longer see private account details when they open your profile
- Opening a menu or dialog no longer shifts the page sideways
- Searching for a name with symbols like ( or * in it no longer fails
- A profile picture over the size limit is refused with a clear message
- Only the people in a chat can read it or post in it
- Typing shows in a chat started since the page loaded
- A message sent straight after reconnecting is no longer lost
- Two messages sent quickly no longer arrive the wrong way round
- Each friend appears once in your chats
- Logging out ends the session on the server, not only in the browser
- A button no longer stays loading forever after the page was closed mid-request
- Closing one tab no longer shows you offline while another is still open
- Accounts made with GitHub or LinkedIn show the right sign-in method
- Signing in with Google, GitHub or LinkedIn needs an email verified there
- Signing in with Google only accepts a sign-in made for Whisprl
- Someone who signs up with an email they do not own can no longer keep a password on it
- Verification codes cannot be guessed past the attempt limit by trying many at once
- Friend requests show when they were actually sent
- Whisprl no longer logs you out on its own, and Safari and other browsers that block cookies from other sites stay logged in, after logging in once more with this update
- A session that ends shows one notice instead of several
- Full-screen views on a phone fill the whole screen, without a gap at the edges
- A message that arrives while the chat list is still loading no longer drops out of the list

### Developers

- The frontend has its first tests, and the gate runs them
- The backend needs GOOGLE_AUTH_CLIENT_ID for Google sign-in, and no longer reads JWT_REFRESH_SECRET
- The backend checks passkeys with @simplewebauthn/server, and FRONT_URL must be the address the app is served from
- Sessions are bound to a key the browser cannot export rather than a cookie, so the backend no longer uses cookie-parser
- Merging into rc or production needs no approval, and only a release publishes anything: the versioned GitHub release, with no rc pre-release or attached build

### Internal

- Frontend code is organised by page, with unused files and assets removed
- Rate limits sit on each route instead of one limit for the whole API
- Auth, friend and conversation logic lives in services

## [1.0.0] - 2026-10-04

### Improvements

- Renamed throughout from TwinkConnect to Whisprl: the page title and social metadata, the sidebar and welcome screens, the OTP and password reset emails, and every link

### Developers

- One gate, `scripts/check.sh`, run by CI on every pull request: loads every backend module, runs the frontend tests and builds the frontend
- Release flow: `scripts/release.sh` and `scripts/skip-release.sh`, this devlog, `CHANGELOG.md`, the `release-ready` check and version-controlled branch rulesets

### Internal

- Licence declared as CC0-1.0 in both packages, matching `LICENSE`
- `frontend/build` and `frontend/coverage` are ignored where they are actually written

[2.1.0]: https://github.com/itsvaibhavmishra/Whisprl/releases/tag/v2.1.0
[2.0.0]: https://github.com/itsvaibhavmishra/Whisprl/releases/tag/v2.0.0
[1.0.0]: https://github.com/itsvaibhavmishra/Whisprl/releases/tag/v1.0.0
