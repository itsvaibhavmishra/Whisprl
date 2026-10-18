# Development

## What you need

- Node 22 and npm 10. CI runs Node 22.
- To run the app, not to run the gate: `backend/.env` and `frontend/.env`. Each
  package has a `.env copy` listing every key and marking which are required.
- To release: `gh` (authenticated), `git` and `python3`.
- For the Android app: Android Studio, for the SDK, an emulator on a Play Store image, and the
  JDK 21 it bundles.

## Build and check

```sh
cd backend && npm install && npm run dev     # the API under nodemon, reads backend/.env
cd frontend && npm install -f && npm start   # the app via react-app-rewired, reads frontend/.env
scripts/check.sh                             # the gate
```

Run the gate before every commit and **gate on its exit code**, not on a read of its output. A
pipe into `tail` or `grep` reports the exit code of the pipe, so a failed build looks green.

Backend tests use Node's own runner, so they need no extra dependency: `cd backend && npm test`
runs every `*.test.js`. Keep them to pure functions, like the seating rules in
`src/services/games/seats.test.js`, since the gate has no database.

## The Android app

The app is the web build inside a Capacitor shell, in `frontend/android/`. Every screen is the
same React code, except the welcome tour (`pages/auth/AppTour.js`) that replaces the landing
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
key's Download becomes Save to password manager, through Android's Credential Manager. A phone
with nowhere to save passwords says so, and Copy still works. Passkeys need WebAuthn, which the
web view does not offer, so the app leaves the passkey step out of setup.

**Notifications.** The app gets pushes through Firebase Cloud Messaging. It needs the Firebase
project's `google-services.json` in `frontend/android/app/`, which is kept out of git, and the
backend needs that project's service account JSON, on one line, as `FIREBASE_SERVICE_ACCOUNT`.
Without the file the app offers no notifications, since asking Firebase for a token would crash
it, and without the variable the server sends none. A phone's token is kept on its session, so
logging out stops its pushes. A push names who wrote and never what, since the server cannot read
messages, and muted chats get none.

**Signing in with Google.** Google refuses its sign-in page inside a web view, so the app asks
Android for the token instead, through Credential Manager in `GoogleSignInPlugin.java`. That
returns an ID token rather than the access token the website gets, and `socialAuthService.js`
tells them apart by shape and verifies the ID token's signature, issuer, expiry and audience with
`google-auth-library`. Both carry the same audience, the web client id in
`GOOGLE_AUTH_CLIENT_ID`, so one account works from either.

The app offers Google and email sign-in only. GitHub and LinkedIn are for the website.

`versionName` is read from `frontend/package.json`, so the app carries the web app's version.
`versionCode` is a plain counter in `frontend/android/app/build.gradle`.

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
  writes "Deleted account" over them; restoring puts them back. Staff pages read
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

## Emails

Every email is built from one shell in `backend/src/templates/mail/layout.js`, so the four
templates differ only in their content. A template returns `{ html, text }`: the plain-text
half is not optional, because a message with no text part is one of the oldest spam signals
there is. `sendMail` passes both to Nodemailer, which sends them as one multipart message.

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
- **Merging into `production` publishes** a GitHub Release tagged `v<version>`, with that version's
  changelog section as its notes. It skips that if the tag already exists, so an ordinary merge
  that did not bump the version cannot cut a duplicate. Netlify and Northflank deploy from the
  branches themselves, so no build is attached.
- **The `skip release` label** on an `rc` into `production` PR turns off the release-ready
  checks, for a merge that is deliberately not a release.

## Cutting a release

```sh
scripts/release.sh 0.2.0     # that version
scripts/release.sh           # asks, offering the next patch
```

That refuses a dirty tree, cuts `release/0.2.0` from `origin/rc`, moves the devlog into a
dated `CHANGELOG.md` section, stamps What's new's upcoming highlights with the version and date
(`scripts/whatsnew.py`), bumps the version, runs the gate, commits, pushes, and opens
**both** pull requests: the prepare one into `rc`, and the release one from `rc` into
`production`. If the gate fails it deletes the branch and pushes nothing, leaving the tree as it
found it.

Merge the prepare PR, then the release PR. Nothing else is needed: `release-ready.yml` blocks
the second merge unless the version went up, the changelog has a dated section for it, the
devlog is empty, What's new has nothing left in `upcoming`, and the tag is free.

```sh
scripts/skip-release.sh
```

opens an `rc` into `production` PR already labelled `skip release`, for moving work to `production`
without cutting a version. Anything left in `devlog.txt` stays there and lands in whichever
version is released next, so nothing is lost by merging one.

A version is published once. A mistake means burning a number rather than replacing it.

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
│   ├── vercel.json
│   └── src/                 routes, controllers, services, models, middlewares,
│                            utils, templates/mail
├── frontend/                React 18 + MUI app
│   ├── android/             the Android app's Capacitor shell and its native key vault
│   ├── capacitor.config.json
│   ├── config-overrides.js  react-app-rewired overrides, including the @ alias
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

- **`pages/`**: one file per route, lazy-loaded from `routes/index.js`.
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
