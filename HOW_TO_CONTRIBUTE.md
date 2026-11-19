# How to contribute to Whisprl

Thanks for helping. This page shows how to send a change. It takes a few minutes.

## The short version

1. Branch from `rc`.
2. Make one change.
3. Run the checks.
4. Add a line to `devlog.txt`.
5. Open a pull request into `rc`.

We take it from there.

## Step by step

### 1. Get the code

Fork the repo, then clone your fork. To run the app, see "Running it" in the
[Readme](Readme.md#running-it). Each package has a `.env copy` file that lists the keys it needs.

### 2. Make a branch from `rc`

```sh
git checkout rc
git pull
git checkout -b fix/short-name
```

Always start from `rc`, never from `production`.

### 3. Make your change

- Keep it to one thing. Two fixes means two pull requests.
- Follow the style of the code around it.
- If you add a package, say why in the pull request.
- Never commit a `.env` file.

### 4. Run the checks

```sh
scripts/check.sh
```

It must pass. It runs lint, format checks, tests and the build, and needs no database or keys.
If it fails, fix the cause and run it again.

### 5. Add a line to `devlog.txt`

Add one short line saying what changed, written for the people it affects. Put it under the
heading that fits:

| Heading      | Use it for                           | Example                                      |
| ------------ | ------------------------------------ | -------------------------------------------- |
| New          | something you could not do before    | `You can pin a chat to the top of the list`  |
| Improvements | something that works better now      | `Chats open faster on slow connections`      |
| Fixed        | something that was broken            | `Sending a photo no longer fails on Android` |
| Developers   | how the app is built or tested       | `Tests run in half the time`                 |
| Internal     | clean-up nobody outside would notice | `Split the chat list into smaller pieces`    |

Headings sit two spaces in, lines sit four spaces in. Keep that spacing, or the checks fail:

```
  - Fixed:
    - Sending a photo no longer fails on Android
```

### 6. Open a pull request into `rc`

- Set the base branch to **`rc`**. A pull request into `production` will be closed.
- Give it a plain title that says what it does, like `Fix photo upload on Android`.
- Fill in the template:
  - **What** it changes.
  - **Why** it is needed. This is the part we cannot guess.
  - **How to test it**: the steps to see it working.
  - **Screenshots or a screen recording** if anything on screen changes. Show it on a phone
    and a desktop width. A before and after helps.
  - **The issue it fixes**, if there is one: write `Closes #123`.

## What happens next

1. We read your pull request and may ask for changes.
2. If the change is right, we merge it into `rc`, the next release.
3. We decide when it ships, the version number and the kind of release. You do not need to
   do anything for that.

## Please leave these to us

- Version numbers, in either `package.json` or the Android app.
- `CHANGELOG.md`. Your devlog line moves there when we release.
- Release labels and pull requests into `production`.

## Licence

Whisprl is released under [CC0 1.0](LICENSE). By sending a pull request, you agree your change
is released under it too.
