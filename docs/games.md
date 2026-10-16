# Building a game

Games live inside a conversation. The chat stays where it is and the game opens beside it, so a
game is a panel in the chat screen rather than a page of its own.

Everything here is about adding a second game. The first one, tic-tac-toe, exists to prove the
shared parts, so copy how it is put together rather than inventing a new shape.

## The one rule

**The server decides, the client draws.** Rules, turns, the clock and the bot all run on the
server. The client sends intents ("play square 4") and renders whatever comes back. Nothing a
player sees is decided in their browser.

This is not negotiable, and it is what makes the rest possible: a bot can play for someone whose
connection dropped, a turn can run out while nobody is looking, and two people cannot disagree
about who won.

It also means a game is **not** end-to-end encrypted, unlike the chat beside it. The Terms page
says so, and any new game inherits that sentence rather than needing a new one.

## The order of work

Each step exists because the one after it is expensive to redo. Going out of order is how a
board gets drawn twice.

1. **Requirements.** Who plays, how many seats, what ends a game, what a bot has to be able to
   decide. Write this down before anything else, because it sets the minimum and maximum player
   count, and those two numbers reach into seating, the lobby and the leaderboard.
2. **Rules, as pure functions.** `setup`, `play`, `outcome`, `botMove`. No database, no sockets,
   no clock. They take state and return state.
3. **Tests for the rules.** Node's own runner, no new dependency. Every rule and every bot
   decision. These are quick to write while the rules are fresh and they are the only part of a
   game the gate can check, since the gate has no database.
4. **Wire it to the canvas.** Add it to both catalogs. At this point it is playable, with no art.
5. **Artwork.** Only now, because the rules may still have changed the board.
6. **Cut the artwork out and measure it.** See below. This is the step that goes wrong quietly.
7. **Check placement before building the screens.** Draw the real pieces at the measured
   positions and look at the result. A wrong measurement found here costs minutes. Found after
   the screens are built, it costs a day of nudging numbers.
8. **Build the three screens**, then check them at every size the panel can be.

## What a game provides

### On the server

One object, exported from `backend/src/services/games/<game-id>/index.js`:

| Key | What it is |
|---|---|
| `id` | the game id, which is also its folder name |
| `minPlayers`, `maxPlayers` | how many seats, and how few can start |
| `turnSeconds` | how long a turn lasts before the bot plays it |
| `setup(previous)` | a fresh state, given the last game's final state so openers can alternate |
| `turnOf(state)` | which seat is to move |
| `play(state, seat, move)` | validate and apply, or throw |
| `outcome(state)` | `null` while the game runs, otherwise `{ winners: [seatIndex] }`, empty for a draw |
| `botMove(state, seat)` | what this game's bot plays |
| `viewFor(state, seat)` | what that seat is allowed to see, including the moves it may make |

`viewFor` is the one to think hardest about. The first games hide nothing, but it is what makes a
card game possible later: everyone sees how many cards a player holds and never which. A game
that returns raw state is fine only because it has nothing to hide, and should say so.

`botMove` belongs to the game, not to the canvas. Each game's bot plays that game its own way,
and a deliberately ordinary bot is the right default: games it finishes for someone who left
count on the leaderboard unmarked, so a bot that never loses would poison the scores.

The same bot can also be chosen as an opponent from the start screen. A chosen bot sits in a seat
with no person in it, is always ready, gives its seat up to any person who sits there, and
leaves once nobody is left at the table. A game with a chosen bot in it is practice and is
never recorded, so a game needs nothing extra to offer it.

### On the client

One object, exported from `frontend/src/sections/chat/game/games/<game-id>/index.js`: the game's
name and summary, its fixed theme, the panel widths it wants, its board component and its move
sound.

A game has no light or dark mode. It looks how it was drawn, and the chrome laid over it uses one
fixed style so it stays readable on any art.

## Where the files go

```
backend/src/services/games/
├── catalog.js                 every game the server knows, by id
├── seats.js                   seating rules, shared by every game
├── seats.test.js
└── tic-tac-toe/
    ├── index.js               the contract above, assembled from the two below
    ├── rules.js               setup, play, outcome, viewFor
    ├── rules.test.js
    ├── bot.js                 how this game's bot chooses
    └── bot.test.js

frontend/src/sections/chat/game/   the canvas: seats, panel, screens, sounds
├── catalog.js
├── GamePanel.js, GameRoom.js, GameSeats.js, ...
└── games/
    └── tic-tac-toe/
        ├── index.js           theme, widths, board, move sound
        ├── Board.js           renders a view, sends intents
        └── tiles.json         measured positions, see below

frontend/public/games/tic-tac-toe/
├── scene.webp
├── board.webp
└── title-tic.webp, title-tac.webp, title-toe.webp
```

**Each game owns a folder in all three places**, named after its id, and nothing outside that
folder changes when a game is added except the two catalogs. If adding a game means editing the
canvas, the canvas is missing something: widen the contract on purpose rather than special-casing
one game inside shared code.

**Artwork goes in `public/`, not through an import.** It is fetched the first time someone opens
that game and never reaches the app bundle, so a chat that never plays anything downloads none of
it. Keep a game's art under a few hundred kilobytes in total.

## Artwork

### Asking for it

Ask for art on a **plain green background** rather than with transparency. Green keys out cleanly
and is easier to produce.

The one rule: **nothing in the subject may be the key colour.** A stone title with green moss and
leaves cannot be keyed, because the leaves key out with the background. Check the subject's
palette before asking for the art, not after.

Also ask for:

- **The board separately from the scene.** A board baked into the background cannot scale or move
  on its own, which rules out resizing and any animation of the board.
- **A clear top and bottom in the scene.** The bar sits at the top and the buttons at the bottom,
  so art there is hidden.
- **Pieces that animate separately as separate files.** Anything inside one image is frozen
  relative to everything else in it.
- **2x the largest size it will be shown at.** A panel that can be 820 wide needs art at least
  1640 across.

### Cutting the background out

```sh
magick in.png -colorspace sRGB -alpha set \
  -channel A -fx 'mx = max(u.r, u.b); lead = u.g / max(mx, 0.02);
                  u.g - mx < 0.03 ? 1 : 1 - min(1, max(0, (lead - 1.15) / 0.45))' +channel \
  -channel G -fx 'min(u.g, max(u.r, u.b))' +channel \
  out.png
```

The first expression builds the alpha from how far green outruns red and blue, as a ratio rather
than a difference, so a green that has been darkened by a shadow still keys out. The second pulls
the green spill back out of the edges.

Then check it, because a key that looks right on the colour it will sit on can still be wrong:

- **Composite it onto magenta** and look. Any green fringe shows against magenta and hides
  against lilac.
- **Check the interior is solid.** `-alpha extract` and read the minimum: a hole punched through
  the middle of a shape reads as a stray transparent pixel, not as something you would notice.
- **Expect the baked shadow and any rim glow to disappear.** Both are semi-transparent over the
  background, so they cannot survive. Add them back in CSS, which is better anyway, because a
  shadow in CSS can move when the piece does.

Export as WebP at quality 92.

### Slicing one image into pieces

Art that animates in parts, such as a title whose words drop in one at a time, arrives as one
image with gaps. Find the gaps by reading a column profile of the alpha channel rather than by
eye, cut each piece to its own bounds, and store each piece's position as a **fraction of the
whole**, so the pieces hold together at any size.

Then **reassemble the pieces and compare against the original**. `magick compare -metric AE`
should report zero differing pixels. If it does not, the recorded positions are wrong and
everything placed with them will be wrong too.

### Measuring a board

Pieces have to land in the middle of their squares at every size, so the board needs measuring
once, carefully.

**The trap:** a raised square in a 3D render casts a shadow below it. Detecting dark bands finds
the shadows, not the squares, and every position comes out low by the depth of the shadow. This
is easy to miss because the error is consistent and the board still looks plausible.

So:

- **Measure the lit faces, not the gaps between them.**
- **Measure every square separately.** A painted or rendered grid is not perfectly even, and the
  outer squares in particular are not where a regular grid says they are.
- **Lay a labelled ruler over the art and read the numbers off it.** Automatic detection is worth
  trying, but the eye is better at telling a square's face from its bevel, and there are only a
  handful of squares.
- **Store the result as `tiles.json`**, as percentages of the board image, one box per square.
  Percentages, so the data survives the art being re-exported at another size.

Then verify it the only way that counts: **draw the real pieces at the measured positions and
look at the board.** Not outlines, the actual pieces, because an outline sitting inside a larger
square looks centred even when it is not.

## The three screens

Every game has the same three, and the canvas owns the moves between them. A game supplies the
art and the board.

- **Start.** The game's title, the seats, and one action. This is where people gather and agree to
  play.
- **Game.** The title shrinks into the bar, the players move up into a header with their pieces,
  and the board takes the space.
- **Result.** The final board stays on screen with the winning line drawn over it, and a panel
  rises underneath with who won and the running score for that chat.

Two things that are easy to get wrong:

- **Do not replace the board with a card when a game ends.** The board is the result. Keep it and
  put the panel below it.
- **The result waits for a person, never a timer.** It holds until somebody asks for another game,
  so whoever looked away still sees what happened.

**Pieces are drawn, never typed.** A seat showing the letter X next to a carved X on the board
looks like two different games. Draw the piece once and use that everywhere it appears, at
whatever size.

## Sound

Sound effects are generated in the browser rather than shipped as files, so a game adds no audio
to the repo and no new dependency. Each game names its own move sound.

Browsers refuse to play anything until the person has interacted with the page, so the first
sound in a session may be dropped. That is fine and needs no handling.

Game sound follows the app's sound setting and has its own mute button in the game bar.

## Before it ships

- `scripts/check.sh` passes, judged on its exit code.
- The rules and the bot have tests.
- The board has been checked at the panel's smallest width, its largest, and at phone size. A
  board sized by width alone overflows a short panel, so size it against both.
- Nothing in the panel scrolls sideways at any width.
- Reduced motion is respected.
- The game is playable with a keyboard and every control has a label.
