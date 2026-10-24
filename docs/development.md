# Development

## What you need

- Node 24 and npm 11. CI runs Node 24.
- To run the app, not to run the gate: `backend/.env` and `frontend/.env`. Each
  package has a `.env copy` listing every key and marking which are required.
- To release: `gh` (authenticated), `git` and `python3`.
- For the Android app: Android Studio, for the SDK, an emulator on a Play Store image, and the
  JDK 21 it bundles.

## Build and check

```sh
cd backend && npm install && npm run dev     # the API under node --watch, reads backend/.env
cd frontend && npm install && npm start      # the app via Vite on port 3200, reads frontend/.env
npm run lint                                 # ESLint, in either package
npm run format                               # Prettier, in either package
scripts/check.sh                             # the gate
```

Run the gate before every commit and **gate on its exit code**, not on a read of its output. A
pipe into `tail` or `grep` reports the exit code of the pipe, so a failed build looks green.

Backend tests use Node's own runner, so they need no extra dependency: `cd backend && npm test`
runs every `*.test.js`. Keep them to pure functions, like the seating rules in
`src/services/games/seats.test.js`, since the gate has no database.

Frontend tests run on Vitest in a simulated browser (jsdom): `cd frontend && npm test` runs every
`*.test.js` and `*.test.jsx`, with `vi` in place of Jest's `jest`.

Both packages share one Prettier config, `.prettierrc.json` at the root, and each has its own
ESLint config. Lint enforces the house rules a review would otherwise have to catch: imports
go through `@/` or `#`, never a relative path, and no name is a single letter. The gate fails on
any lint warning or unformatted file. A file containing JSX ends in `.jsx`, the rest in `.js`.

## The Android app

The app is the web build inside a Capacitor shell, in `frontend/android/`. Every screen is the
same React code, except the welcome tour (`pages/auth/AppTour.jsx`) that replaces the landing
page.

```sh
cd frontend && npm run build && npx cap sync android    # copy the web build into the Android project
adb reverse tcp:8200 tcp:8200                           # the app reaches the API as localhost
cd android && ./gradlew installDebug                    # build and install on the emulator or phone
```

Gradle needs JDK 21, and Android Studio's works:
`export JAVA_HOME="/Applications/Android Studio.app/Contents/jbr/Contents/Home"`. The app's origin
is `https://localhost`, so `APP_ORIGIN` in `backend/.env` allows it beside `FRONT_URL`. Use a
Play Store emulator image: Block Store and the screen lock prompt come from Play services.

**Keys.** Whenever the app unlocks messages it also keeps the private key in Block Store, through
`KeyVaultPlugin.java`, and restores it from there when its own storage is empty. With the phone's
Google Backup on, that copy outlives reinstalling the app, with or without a screen lock. With
Backup off a reinstall loses it. Clearing the app's data removes it either way, so someone who does
that signs in and unlocks with their recovery key. A copy leaves the phone for Google's backup only
end-to-end encrypted, which needs a screen lock, and moving to a new phone relies on that backup.
Logging out deletes it. The app's own storage is kept out of Android backup by
`data_extraction_rules.xml`, so Block Store is the only way a key leaves the phone. Making a new
recovery key asks for the fingerprint, face or screen lock first, and a phone with no screen lock
goes straight through.

**Recovery key.** The app's web view drops downloads without a word, so in the app the recovery
key's Download becomes Save to password manager, through Android's Credential Manager. A phone with
nowhere to save passwords says so, and Copy still works. Google Password Manager syncs with the
Google account rather than with Backup, so after a reinstall with Backup off the locked screen's Use
my saved recovery key picks the key back from it, and a key typed in to unlock is offered a place
there for next time. Passkeys need WebAuthn, which the web view does not offer, so the app leaves
the passkey step out of setup.

**Notifications.** The app gets pushes through Firebase Cloud Messaging. There are two Firebase
projects, one for development and one for production, and an app only receives pushes from the
backend holding the matching project's credentials. Each project gives two different files:

- `google-services.json`, which identifies the project to the app and ships inside the APK. The
  development one goes in `frontend/android/app/` and a debug build reads it; the production one
  goes in `frontend/android/app/src/release/` and a release build reads that instead. Both are
  kept out of git, and a release build fails without the production file, or with one from any
  other project, rather than quietly sending people to the wrong project.
- The service account JSON, from Project settings, Service accounts, Generate new private key.
  It is a private key and never goes near the app: the backend holding that project reads it on
  one line as `FIREBASE_SERVICE_ACCOUNT`. To replace it, generate a new key, swap the variable,
  then delete the old key under Service accounts in Google Cloud.

Without the file the app offers no notifications, since asking Firebase for a token would crash
it, and without the variable the server sends none. A phone's token is kept on its session, so
logging out stops its pushes, and muted chats get none.

The server cannot read a message, so a push carries it still sealed, with only the key sealed for
that phone, and `MessageNotificationService.java` opens it on the phone with the key held in Block
Store, even while the app is closed. `MessageCipher.java` repeats the steps of `messageCipher.js`,
and both are tested against the same messages in `messageVectors.json`, sealed by the web cipher,
so a change to one that the other misses fails a test. Run the Java side with
`./gradlew :app:testDebugUnitTest` from `frontend/android/`. A message too long for a push, or one
the phone cannot open, shows as "New message". Pushes are data only and high priority, so the app
decides what is shown, and shows nothing while it is on screen.

**Signing in with Google.** Google refuses its sign-in page inside a web view, so the app asks
Android for the token instead, through Credential Manager in `GoogleSignInPlugin.java`. That
returns an ID token rather than the access token the website gets, and `socialAuthService.js`
tells them apart by shape and verifies the ID token's signature, issuer, expiry and audience with
`google-auth-library`. Both carry the same audience, the web client id in
`GOOGLE_AUTH_CLIENT_ID`, so one account works from either.

The app offers Google and email sign-in only. GitHub and LinkedIn are for the website.

**Links.** A link to the website's chat, contacts, status or settings pages opens the app when it
is installed, and the website when it is not, so a shared profile link works for everyone. The
app's profile links point at the website for the same reason, since its own origin is
`https://localhost`. Android checks `frontend/public/.well-known/assetlinks.json` on the site
against the key that signed the app, so that file has to list the SHA-256 fingerprint of every key
that signs a build people install: the debug key of the machine that builds it, and the release key,
which signs release builds and which Play App Signing uses once the app is on Play. Release builds
are signed with the release key whenever `frontend/android/keystore.properties` names it; the key and that file
stay out of git, and the key is backed up outside this machine. Google sign-in checks the same keys:
each needs an Android OAuth client with its SHA-1 in the Google Cloud project that holds the web
client. Sign-in pages under `/auth` stay in the browser, so a web
sign-in that returns there is never taken over by the app. Opening a link while the app is closed
or open lands on that page through `OpenAppLinks.js`, and checking it before deploy works with
`adb shell am start -a android.intent.action.VIEW -d "https://whisprl.netlify.app/contacts/@someone"`.

`versionName` is read from `frontend/package.json`, so the app carries the web app's version.
`versionCode` is a plain counter in `frontend/android/app/build.gradle`, raised only when the
native side changes.

**Live updates.** An installed app updates its web code without a new APK. Each release builds
the frontend with the production settings, zips it, signs it, and attaches `app-update.zip` and
`app-update.json` to the GitHub release (`scripts/app-update.sh`, run by `release.yml`). On every
launch and every return to the foreground the app reads
`releases/latest/download/app-update.json`, and downloads the update only when it is newer than
the version running, its signature matches the public key in `capacitor.config.json`, and the
APK's `versionCode` is at least the `minNativeVersion` it names, which is the `versionCode` it was
built against. The update applies on the next launch. The app then calls `ready()` once it has
drawn, and an update that does not within 10 seconds is rolled back to the version inside the APK
and never tried again. All of this is `utils/liveUpdate.js`, with the plugin
`@capawesome/capacitor-live-update` and no paid service.

- **Prefer a web release, and batch what needs an app release.** A web release reaches every
  user on their next launch; an app release makes each of them install a new APK or Play update.
  Updating npm packages is web code, except the native ones: `@capacitor/*`, `@capawesome/*` and
  `@sentry/capacitor`, which change the APK and wait for the next app release with any Java or
  Gradle change. Backend changes need no app release at all.
- **Only web code travels this way.** Any change to Java, a plugin or a permission raises
  `versionCode` and ships as a new APK, or through Play once the app is there, and older APKs
  skip every update built after it. An update must not break any other Play rule: it never adds
  what a Play review would refuse, and never changes what the app is for.
- **The signing key** is RSA, kept in the `LIVE_UPDATE_KEY` repository secret and nowhere in the
  repo. Losing it means no installed app accepts another update until people install an APK
  carrying a new public key, so keep a copy in a password manager.
- **The production settings** come from repository variables named like the `REACT_APP_` keys in
  `frontend/.env copy`, the same values Netlify builds the website with.
- **The APK** is built in the same run from the same web build and attached as `whisprl.apk`,
  signed with the release key from the `ANDROID_KEYSTORE_BASE64` and `ANDROID_KEYSTORE_PASSWORD`
  secrets, with the production Firebase config from `GOOGLE_SERVICES_JSON`, which has to be
  `whisprl-prod`. A release with any of these secrets missing fails before it publishes anything.
- **The Play bundle** is built only for an app release, from the same build and signing, and
  attached as `whisprl-play.aab`. Play accepts each `versionCode` once, so a web release would
  only repeat the last code. To put a release on Play, download the bundle from the release and
  upload it under Testing or Production in the Play Console, where it shows as
  `<versionCode> (<version>)`.
- **`REACT_APP_UPDATE_URL`** is set only for builds people install. A development build leaves it
  out, so it never replaces itself with production code. A production APK must be built with it,
  or that APK never updates.
- **Testing an update locally:** build an APK with `REACT_APP_UPDATE_URL` pointing at
  `http://localhost:8300/app-update.json`, raise the version in `frontend/package.json` for a
  moment, run `scripts/app-update.sh <key> <folder> http://localhost:8300`, put the version back,
  serve the folder on port 8300 and `adb reverse tcp:8300 tcp:8300`. The next launch stages the
  update and the one after runs it.

## Staff roles

`OWNER_EMAIL` in `backend/.env` names the one account that owns Whisprl. It is read on every
request rather than stored, so nothing inside the app can hand ownership to another account,
and changing the environment is the only way to move it. The account still has to exist and
be verified; until then nobody is the owner. Every other account is a `user` or an `admin`.

`roleOf` is the one place a role is decided, and it only ever answers `owner`, `admin` or
`user`. Most accounts predate the field and have no stored role at all, and a record read
without Mongoose's defaults (a `.lean()` query) arrives with `role` undefined, so the staff
check must not be written as "anything but user": that would let every old account through.

An admin can do only what the owner ticked for them, from six permissions in
`PERMISSIONS` (`userModel.js`): `overview`, `people`, `reports`, `suspend`, `ban` and
`audit`. The owner holds all six plus `team`, which no admin can be given, so nobody but the
owner can add admins or change what they can do. `permissionsOf` works this out, and the
session user carries the result so the panel can hide what someone cannot use.

Staff reach the admin panel at `/admin`, which also has a row in Settings that only staff see.

- **The server is what keeps the panel private.** Every `/api/admin` route sits behind
  `protect` and `staffOnly`, and anyone who is not staff gets the same 404 as an address that
  does not exist. The route itself is no secret, since the code is public.
- **Each route checks its own permission.** `allow(permission)` refuses anything outside an
  admin's permissions with a 403, whatever the panel shows. Lifting a suspension needs
  `suspend` and lifting a ban needs `ban`, so the restore route checks inside the service,
  where the account is known.
- **The admin code loads only for staff.** Its layout and pages are lazy chunks behind the
  `StaffOnly` guard, so nobody else's browser downloads them.
- **An account is active on any day it opened Whisprl.** Every new session and every token
  renewal (which every page load makes) records one row per account per UTC day in
  `activities`, and the overview's active counts read those rows.
- **Suspending and banning shut an account out at once.** Both end every session and
  disconnect every socket, and `findSessionUser` refuses them on each later request, so a
  token still in flight cannot be used. A suspension names the day it ends.
- **Suspending, banning and restoring email the person, with the reason staff gave.** The
  action dialog says so. The email is sent after the action and never holds it up: a failed
  send is logged and the action stands.
- **A ban writes the placeholder in rather than hiding the account on read.** `populate`
  skips query middleware, so masking on read missed most of the places a person is shown.
  Banning moves the name, username, photo, cover and status line into `hiddenProfile` and
  writes "Whisprl user" over them; restoring puts them back. Staff pages read
  `hiddenProfile` to show who it really is.
- **Every staff action records an audit entry** through `recordAction`, and asks for the
  acting person's passkey first. Staff without a passkey are told to add one in Settings:
  there is no fallback, since a weaker second path would set the bar.
- **Staff cannot suspend or ban staff**, or themselves. An admin has to be removed from the
  team before anything can be done to their account.
- **The Team page is the owner's.** It adds an admin by the email they log in with, changes
  what they can do, and removes them, each with a reason and the owner's passkey. The audit
  entry records the permissions granted.

## Reports

A report names a person, a chat, a group or an update. What staff can do with it depends on
what the server is able to see.

- **Already visible:** profile photos and covers, a group's name, picture and members, and
  updates shared with everyone, which are stored as they are. The queue shows these directly.
- **Never visible:** messages, and updates meant for particular people. The only way staff can
  read those is if the reporter's own device decrypts them and sends them, which the report
  dialog says plainly before anything is sent.
- **What a report attaches:** the messages around the reported one, from both sides, with the
  key for each attached file. The admin page decrypts those files in the browser, so the
  server never holds a plain copy. Attached messages are deleted 90 days after a report
  closes, swept alongside expired messages and statuses.

### Franking: proving an attached message is real

A reporter sends plaintext, so without a check they could invent a conversation. Every message
is sent with a random key sealed inside it and an HMAC of the payload under that key stored in
the clear as `franking`. Neither half says anything on its own. On a report the plaintext comes
back, the server takes the key out of it, recomputes the HMAC and compares, and each attached
message is stored as `verified`, `failed`, or `unchecked` for one sent before franking existed.
`unchecked` is not the same as `failed`, and the queue says which it is.

An edit is franked again with a fresh key, and the new fingerprint replaces the old one. An edit
that arrives without one clears the stored fingerprint, so the message reads as `unchecked`
rather than failing against words that are no longer there.

## Game requests

The last card in the games list asks for a game: a classic, something new or an idea of the
person's own, with its name, up to three links and optional details, and no media. A person has
one open request per game, and five a day.

Staff with the `requests` permission see them at `/admin/requests`, grouped by game and ranked by
how many people asked. `nameKeyOf` in `src/utils/textSearch.js` folds a name to a key, so
"Tic-Tac-Toe", "tic tac toe" and "The TicTacToe" count as one game. The search scores in memory
with `searchScore` from the same file: every word has to match, names weigh three times what the
details, links and requesters' names do, and a word can match by its start, with a typo or two,
or run into the next word. A name that starts with the query ranks first. That suits the
hundreds or thousands of requests Whisprl gets; at many more it would need a search index.

Marking a game added or dismissed closes every open request for it. It changes nobody's access,
so it needs no passkey, and who did it and when are kept on the requests rather than in the audit
log. A person's requests are deleted with their account.

## Deleting an account

Settings, then Account, then Delete account asks why someone is leaving, with "Something else"
asking for a few words, then emails a code to the account's address. Entering it logs the account
out everywhere, emails the date it goes, and deletes it 14 days later. Until then it is hidden
the way a ban hides an account: friends see "Whisprl user", searches and suggestions leave it out,
and its username stays reserved. Logging in any way before then, the username included, shows it
again and cancels the deletion. Staff accounts cannot be deleted, so the owner and admins
give up their access first.

The server sleeps on a free plan, so nothing waits on a timer. `deleteDueAccounts` in
`accountDeletionService.js` deletes every account past its date when the server starts and once
a minute after that, and logging in to an account already past its date deletes it there and
then rather than letting it back in.

A deleted account stays as a placeholder, the same "Whisprl user" a ban shows, because the
people it chatted with need its public keys to open what it sent them. Everything else goes:
the email becomes an unusable `<id>@deleted.invalid`, which frees the address for a new account,
and the password, username, birthday, photos, statuses, passkeys, friends, requests and settings
are removed. It leaves every group, handing on any it owned. The reason, and any note, stay on
the placeholder as the only record of why people leave. No email is sent when the account is
actually deleted.

## Error reports

Production errors go to Sentry, in the EU region (Frankfurt), organization `whisprl`. Two
projects: `whisprl-web` for the website and the app's web code, each report tagged `web` or
`android`, and `whisprl-backend` for the server.

- **Website and app:** `utils/errorReports.js` starts before the first render and reports
  uncaught errors and promise rejections. In the app, Sentry's native SDK also reports Java
  crashes, sending each on the next launch. A crash while drawing shows `CrashScreen` with a
  reload button instead of a blank page. It sits inside the live update's start signal, so an
  update that crashes on start still rolls back.
- **A tab left open across a deploy** asks for page code the deploy removed. `utils/newVersion.js`
  reloads it once instead, unreported, which fetches the new version. A failure again within a
  minute of that reload shows the crash screen and is reported, and one while offline shows the
  crash screen without a report, since a reload cannot help and the connection is not a bug.
- **Backend:** `src/utils/errorReports.js` reports every 500 from the Express error handler,
  every crash that ends the process, and every failed background sweep.
- **What a report never holds:** session replay, console output, clicks, request bodies,
  headers or query strings, or any text a message quoted in double quotes, since a parse error
  quotes what it failed on and that can be a decrypted message. The person is identified by
  account id only, and Sentry never stores the IP address. Keep it this way: anything on screen
  in Whisprl may be decrypted.
- **Off unless a DSN is set.** `REACT_APP_SENTRY_DSN` for the frontend and `SENTRY_DSN` for the
  backend are set only in production, so errors met while developing stay in the console and do
  not use up the free plan's monthly allowance, which the whole organization shares.
- **Readable stack traces:** every frontend build runs `scripts/sentry-sourcemaps.sh` after it,
  which, given `SENTRY_AUTH_TOKEN` and `REACT_APP_SENTRY_DSN`, ties the built code to its source
  maps and uploads them for release `whisprl@<version>`. It does nothing without them, so the
  gate and development builds skip it. The token is an organization token, limited to tasks like
  this one; it is never needed by the running app or server.

## Emails

Every email is built from one shell in `backend/src/templates/mail/layout.js`, so the
templates differ only in their content. A template returns `{ html, text }`: the plain-text
half is not optional, because a message with no text part is one of the oldest spam signals
there is. `sendMail` passes both to Nodemailer, which sends them as one multipart message.

- **Text people typed goes in through `escapeHtml`**, and a greeting through `greeting(name)`,
  which does it already. Whisprl stores text as it was typed and React escapes it on screen, so
  an email's HTML is the one place a name or a reason could turn into markup. The plain-text
  half takes the values as they are.
- **The header band is navy in both colour schemes**, like the app's rail. That is what lets
  one logo work everywhere: an image that has to look right on white and on near-black needs
  two files and a swap, and this needs neither.
- **Dark mode is handled three times over**, because clients disagree on how to do it. A
  `prefers-color-scheme` block covers Apple Mail and iOS, `[data-ogsc]` selectors cover
  Outlook, and anything that ignores both gets the light design. Gmail's apps invert colours
  themselves and cannot be told not to, so the palette is chosen to survive being inverted.
- **Links are recoloured in dark mode, and the button is put back.** A blanket rule on `a`
  turns every link to the night accent, which would leave the call to action unreadable on its
  own accent, so `.cta a` is forced back to white after it.
- **Every piece of text passes WCAG AA** against whatever sits behind it, in both schemes. The
  opt-out line especially: faint small print is both unreadable and something filters look for.
- **Images are served from Cloudinary**, the same account the app already uploads to, under
  `email-media/`. The pictures themselves live in the repo at
  `backend/src/templates/mail/media/`, and `node scripts/uploadEmailMedia.js` pushes them up
  under a fixed name each, so the address never changes and a template never has to be edited
  to pick up a new picture. Keeping them off `frontend/public/` means an email does not wait
  on a frontend deploy to look right, and the pictures do not ship in the app's bundle.
- **No inbox plays a video.** `<video>` survives in Apple Mail and nowhere else, so the only
  thing that moves in an email is an animated GIF, and Outlook shows just its first frame. A
  three second clip of the showcase video came to 524KB at the smallest size still worth
  looking at. The campaign carries a still collage instead, at 114KB for five panels rather
  than 524KB for three seconds of one. The video belongs where video plays: the site, a post,
  a store listing.
- **The collage is the real app, not a mockup.** `media/collage.jpg` is built from screenshots
  driven through the running app at phone width: a status playing with
  its progress bars, a voice note with its waveform and speed control, a conversation with a
  quoted reply and delivery ticks, a friend request carrying its note, and the chat list with
  a group in it. Each panel is cropped to the part that matters, because a whole phone screen
  is unreadable at the width an email gives it. Rebuild it the same way rather than touching
  it up, so it never claims the app looks like something it does not.

## Versioning

`frontend/package.json` is the source of truth. `scripts/release.sh` writes each new
version to both packages, lockfiles included, through `npm version`, and `release-ready`
fails a release pull request where `backend/package.json` disagrees. Never edit either by
hand to cut a release.

Versions follow [Semantic Versioning](https://semver.org/spec/v2.0.0.html), and tags are
`v<version>`.

## Planning notes

`docs/ideas/` holds the project spec and anything else being thought through rather than
built. The `ideas/` exclude pattern matches at any depth, so nothing in it is ever committed or
pushed even though it sits under `docs/`. Treat it as the working notebook: the rest of `docs/`
is what a contributor reads.

`docs/decisions/` is local in the same way. Each decision not made yet gets one file there,
and the file is deleted once the outcome is recorded in the tracked docs. Committed files
describe only what is decided, and never link into `docs/decisions/` or `docs/ideas/`.

## Branches

`production` is what has been released. `rc` is what is going to be. Nothing is pushed to either
directly.

```
feature branch  ->  PR into rc  ->  PR from rc into production  =  a release
```

- **Cut every branch from `rc`**, not from `production`. Cutting from `production` means rebasing onto
  whatever rc already holds before the PR can merge.
- **Every PR into `rc` adds a line to `devlog.txt`**, under the heading that matches who
  the change is for. The PR template has the checkbox and the file explains the headings.
- **A PR with something worth a highlight also adds it to What's new**, in the `upcoming` list of
  `frontend/src/sections/whats-new/releases.json`: an emoji, a short title and one plain line. It
  is optional, since most changes are not highlights. A development build shows `upcoming` as a
  preview, so it can be read before it ships.
- **Merging `rc` into `production` is the release.** That PR needs no devlog line, because the
  devlog has already moved into `CHANGELOG.md` by then.

## What publishes, and what does not

- **A feature branch** publishes nothing. Push as often as you like.
- **`rc`** publishes nothing either.
- **A release pull request** from `rc` into `production`, labelled `release: web` or
  `release: app`, publishes only a draft APK that only the repository's owners can see (see Trying
  a release on a phone).
- **Merging into `production`** always redeploys the website and the backend, since Netlify and
  Northflank deploy from the branch itself. Whether it also publishes a version depends on the
  pull request's label:

| Label | When | Publishes |
|---|---|---|
| `release: web` | the version went up, `versionCode` did not | a GitHub Release tagged `v<version>` with the changelog section as its notes, the live update and the APK. Installed apps update themselves |
| `release: app` | the version and `versionCode` both went up | the same, with a note that Android users need the new APK, since their app skips this update, and the Play bundle `whisprl-play.aab` |
| none | neither changed | nothing beyond the redeploy |

`scripts/release.sh` picks the label from `versionCode`, and `release-ready.yml` fails a pull
request whose label does not match what changed.

Every release carries `app-update.zip`, `app-update.json` and `whisprl.apk`, and an app release
also carries `whisprl-play.aab` for the Play Console. The workflow publishes a release only once
every file it carries is built, so `releases/latest/download/` always has the first three. Installed apps read their update there (see Live updates under The Android app), and
`releases/latest/download/whisprl.apk` always downloads the newest app. A web release's APK keeps
the same `versionCode`, so it serves new installs and changes nothing for existing ones. A release
that fails to build publishes nothing, and running the Release workflow again from the Actions
tab retries it.

Which release a change needs:

- **A web feature or a frontend fix:** `release: web`. A frontend fix the app should get needs a
  version, even a patch, because the app only takes an update whose version is above its own.
- **A change to Java, a plugin or a permission:** raise `versionCode` in the same pull request,
  and it goes out as `release: app`.
- **A backend-only fix, docs or CI:** no label. The app talks to the same backend, so it gets a
  backend fix with the redeploy.

## Cutting a release

```sh
scripts/release.sh 0.2.0     # that version
scripts/release.sh           # asks, offering the next patch
```

That refuses a dirty tree, cuts `release/0.2.0` from `origin/rc`, moves the devlog into a
dated `CHANGELOG.md` section, stamps What's new's upcoming highlights with the version and date
(`scripts/whatsnew.py`), bumps the version, runs the gate, commits, pushes, and opens
**both** pull requests: the prepare one into `rc`, and the release one from `rc` into
`production`, labelled `release: app` when `versionCode` on `rc` is above production's and
`release: web` when it is not. If the gate fails it deletes the branch and pushes nothing, leaving
the tree as it found it.

Merge the prepare PR, then the release PR. Nothing else is needed: `release-ready.yml` blocks
the second merge unless the version went up, the label matches `versionCode`, the changelog has a
dated section for it, the devlog is empty, What's new has nothing left in `upcoming`, and the tag
is free.

```sh
scripts/skip-release.sh
```

opens an `rc` into `production` PR without a release label, for moving work to `production`
without cutting a version. Anything left in `devlog.txt` stays there and lands in whichever
version is released next, so nothing is lost by merging one. It merges only while `rc` has the
same version and `versionCode` as `production`, so once a native change is on `rc`, only an app
release moves it.

A version is published once. A mistake means burning a number rather than replacing it.

## Trying a release on a phone

Every release reaches the Android app, as a live update or a new APK, so it is tried on a phone
before it ships. The Release workflow does this on its own for the `rc` into `production` pull
request, once it is labelled `release: web` or `release: app` and `rc` is on a new version, which
is the case once the prepare pull request has merged. A pull request with no release label builds
nothing.

It builds the same signed APK the release will, against the rc backend, and publishes it as the
draft release `test-v<version>`. Every push to `rc` while the pull request is open replaces
that draft, cancelling a build still running for an older commit, and publishing the real release
deletes it. A draft is visible only to the repository's owners and never counts as the latest
release, so no installed app reads it and nothing is tagged. Open it in GitHub on the phone and
install `whisprl-test-<version>.apk`. It is its own app, Whisprl Test (`com.vaibhaw.whisprl.test`),
so it installs beside the real app, and over the previous test build, and you sign in to it
separately. The release workflow builds it with Gradle's `testBuild` property, which gives it that
package and name.

A test build has no push notifications, because Firebase knows only the real app's package. It
takes no live updates either, so a release can never move it onto production code. Sign in with
Google works through the Google Cloud project's Android OAuth client for the test package, made
with the upload key's SHA-1, as the real app's is. Links to the website can offer the test build
beside the real app.

The rc backend is a Render service (`whisprl.onrender.com`) with auto-deploy off. The same workflow
deploys it through its deploy hook, at the commit the APK is built from, so the test build runs
against rc's backend changes too. Nothing else deploys it: a merge into `rc` or an `rc` into
`production` pull request with no release label leaves it as it was. It needs the `RENDER_RC_DEPLOY_HOOK` secret and the
`RC_API_ORIGIN` variable (`https://whisprl.onrender.com/api`), and the workflow refuses a test build
without them rather than quietly building against production.

It shares production's database and settings, so you sign in with your own account. Two servers
on one database do not share their sockets, so live updates between the test build and the
production app arrive only on the next fetch, and the production backend refuses a game it does not
have yet: try a new game in a chat only test builds open.

The scripts need `gh` (authenticated), `git` and `python3`. `scripts/changelog.py` holds the
devlog-to-changelog text transforms as pure functions, so it can be read and tested on its own;
the release workflow calls the same script for the GitHub release notes, so the notes and the
PR body cannot drift apart.

## Branch protection

The rulesets are version-controlled in `.github/rulesets/`, rather than clicked into a settings
page nobody can diff:

| Ruleset | Covers | Enforces |
|---|---|---|
| `branches-are-permanent` | `production`, `rc` | no deletion, no force-push |
| `rc-is-next` | `rc` | PR required, `check` green and up to date, signed commits |
| `production-is-released` | `production` | the same plus `ready` |

```sh
scripts/apply-rulesets.sh          # create or update each one on GitHub, matched by name
scripts/apply-rulesets.sh --show   # print what is live now, change nothing
```

Matching by name means it is safe to run repeatedly and will not stack duplicates. Before it
pushes anything it checks that every required status check corresponds to a real workflow job:
a ruleset naming a context no workflow produces blocks every merge into that branch forever.

**Apply the rulesets only after the first push.** They require a pull request and a green
`check` on `production`; applying them to an empty repository locks you out of your own
initial commit. The correct order is: create the repo, push `production`, branch `rc`, then run
the script.

## Layout

```
Whisprl/
├── backend/                 Express + Socket.io API
│   ├── server.js            HTTP server, MongoDB connection, Socket.io init
│   ├── app.js               Express middleware stack and the /api router
│   ├── socket.js            WebSocket event handlers
│   └── src/                 routes, controllers, services, models, middlewares,
│                            utils, templates/mail
├── frontend/                React 19 + MUI app, built with Vite
│   ├── android/             the Android app's Capacitor shell and its native key vault
│   ├── capacitor.config.json
│   ├── index.html           the page Vite builds around src/index.jsx
│   ├── vite.config.mjs      the build, the dev server, the tests and the @ alias
│   ├── eslint.config.mjs
│   ├── public/              includes _redirects for SPA routing on Netlify
│   └── src/                 pages, sections, components, layouts, redux, routes,
│                            theme, contexts, hooks, utils
├── docs/
│   ├── development.md
│   ├── game-art.md          a game's artwork: asking, cutting out, placing against the design
│   ├── games.md             adding a game: rules, contracts, sound, the checks
│   ├── screenshots/
│   ├── ideas/               local only, excluded
│   └── decisions/           local only, excluded
├── scripts/                 check, release, skip-release, rulesets, changelog, artwork
├── .github/                 workflows, rulesets, PR template
├── CHANGELOG.md
├── devlog.txt
├── LICENSE                  CC0 1.0
└── Readme.md
```

Where frontend code goes, inside `frontend/src/`:

- **`pages/`**: one file per route, lazy-loaded from `routes/index.jsx`.
- **`sections/<page>/`**: the pieces of one page, such as `sections/chat/` for the chat screen,
  split further when a page has distinct parts (`conversation/`, `messages/`, `attachments/`).
- **`components/`**: anything used by more than one page, such as `ProfileHero`, the
  image cropper and the form fields in `hook-form/`.
- **`layouts/`**, **`redux/`**, **`routes/`**, **`theme/`**, **`contexts/`**, **`hooks/`**,
  **`utils/`**: as named. Encryption lives in `utils/crypto/`.

Folders are lowercase, files are named after the component or function they export, and every
import goes through the `@/` alias, siblings included.

## Conventions

- **Comments explain why, not what.** If a comment describes what the next line does, rewrite
  the line instead. Keep each to a single line; anything longer belongs in the commit body.
- **No em dashes** in code, comments or docs. Use a colon, a comma or a full stop.
- **No single-letter names.** Not a loop index, not a lambda argument. `_` for a slot the
  language forces you to declare and the code never reads is the only exception.
- **Split a file when it stops reading cleanly**, not when it hits a line count.
- **No timelines.** No durations, deadlines or estimates for work in code, comments or docs
  unless explicitly asked.
- **Never add a dependency without justification.**
