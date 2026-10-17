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
5. **A design prompt per screen.** Hand over one short prompt for the start screen, one for the
   game screen and one for the finished screen, to be used one at a time. Each one carries the
   requirements from step 1, because whoever draws the screen has none of this context. See
   [game-art.md](game-art.md) for what a prompt has to say.
6. **Artwork.** Only now, because the rules may still have changed the board. Ask for the pieces
   the design needs, cut them out and compress them.
7. **Measure it and place it against the design.** Read places off the design rather than by eye,
   fit each piece to it, and look at the overlay. This is the step that goes wrong quietly.
8. **Check placement before building the screens.** Draw the real pieces at the measured
   positions and look at the result. A wrong measurement found here costs minutes. Found after
   the screens are built, it costs a day of nudging numbers.
9. **Build the three screens**, then check them at a real phone width and at every size the panel
   can be.

## What a game provides

### On the server

One object, exported from `backend/src/services/games/<game-id>/index.js`:

| Key | What it is |
|---|---|
| `id` | the game id, which is also its folder name |
| `minPlayers`, `maxPlayers` | how many seats, and how few can start |
| `turnSeconds` | how long a turn lasts before the bot plays it, shown as a ring draining around the player whose turn it is |
| `options` | optional: `{ defaults, assert }` for a game with settings, left out by one without |
| `setup(previous, table)` | a fresh state, given the last game's final state so openers can alternate, and the table: the settings plus `players`, the seat count, and `seating`, who sits where |
| `turnOf(state)` | which seat is to move |
| `play(state, seat, move)` | validate and apply, or throw |
| `outcome(state)` | `null` while the game runs, otherwise `{ winners: [seatIndex] }`, empty for a draw |
| `botMove(state, seat, level)` | what this game's bot plays, at `"opponent"` for a bot someone chose to face or `"standIn"` for one covering a player who left |
| `viewFor(state, seat)` | what that seat is allowed to see, including the moves it may make |

`viewFor` is the one to think hardest about. The first games hide nothing, but it is what makes a
card game possible later: everyone sees how many cards a player holds and never which. A game
that returns raw state is fine only because it has nothing to hide, and should say so.

`botMove` belongs to the game, not to the canvas. Each game's bot plays that game its own way,
and a deliberately ordinary bot is the right default: games it finishes for someone who left
count on the leaderboard unmarked, so a bot that never loses would poison the scores.

**Tune a bot by playing it, not by reasoning about it.** Play it a thousand games against a
practised player built from the same bot with its slips turned off, and against a casual one, and
read the win, draw and loss rates. A practised player should win a little over half; someone
casual should win and lose both. The bot standing in for a player who left is weaker again, since
nobody chose to face it. Then give each rule's test a fixed roll for whether the bot slips, so the
tests say what it does when attentive and when not, instead of passing by luck.

**The player count is the seat count, not a setting.** Every table opens with `minPlayers` seats.
In a group, whoever runs it sets the count up to `maxPlayers` from the start screen, with the
`seats` action; new seats go on the end, only empty ones are taken away, and a count below the
players already seated is refused. A game starts once every seat is taken and ready. `assert` is
handed the settings with the seat count, because a board size and a player count can rule each
other out.

The same bot can also be chosen as an opponent from the start screen. A chosen bot sits in a seat
with no person in it, is always ready, gives its seat up to any person who sits there, and
leaves once nobody is left at the table. A game with a chosen bot in it is practice and is
never recorded, so a game needs nothing extra to offer it.

### On the client

One object, exported from `frontend/src/sections/chat/game/games/<game-id>/index.js`:

| Key | What it is |
|---|---|
| `id`, `name`, `summary` | what the games dialog shows |
| `art` | its image paths, `beyond` for what the scene runs into past its edge, or `anchor: "top"` and the scene's `ratio` when pieces are placed in the scene's coordinates |
| `preload` | every file the start screen waits for before it animates in |
| `theme` | `surface`, `card`, `ink`, `accent`, `marks` for each seat's colour, and `shade`, the colour the start screen's wash is mixed from |
| `title` | its wordmark as words placed by fraction, so each can drop in on its own |
| `width` | the panel's smallest, preferred and largest width beside the chat |
| `moveSound`, `music` | the sound a move makes, or a function of the states before and after it, and the track it plays; see Sound |
| `moveCountOf(state)` | how many moves are on the board, which is how a move is heard |
| `options` | optional: each setting's `key`, label, choices, `unavailable(value, players)` and a `Preview` component; the defaults come from the server |
| `colourOf(state, seat)` | optional: a seat's colour when the game deals them, rather than `marks[seat]` |
| `Mark` | optional: what stands for a seat, drawn the same everywhere it appears |
| `Board` | lazy: renders a view and sends moves |
| `Masthead`, `mastheadRatio` | optional and lazy: a start screen drawn into the scene, and its stage's shape |

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
        └── tiles.json         measured positions, see game-art.md

frontend/public/games/tic-tac-toe/
├── scene.webp
├── board.webp
├── title-tic.webp, title-tac.webp, title-toe.webp
└── music.m4a
```

A game with art placed in its scene, such as Dots and Boxes, also keeps a `Masthead.js` and the
`masthead.json` that `scripts/artwork.py` wrote for it.

**Each game owns a folder in all three places**, named after its id, and nothing outside that
folder changes when a game is added except the two catalogs. If adding a game means editing the
canvas, the canvas is missing something: widen the contract on purpose rather than special-casing
one game inside shared code.

**Artwork goes in `public/`, not through an import.** It is fetched the first time someone opens
that game and never reaches the app bundle, so a chat that never plays anything downloads none of
it. Keep a game's art under a few hundred kilobytes in total.

## Artwork

Everything about a game's art is in [game-art.md](game-art.md): the design prompt, asking for the
pieces, cutting them out, measuring a board, and placing pieces where the design put them with
`scripts/artwork.py`. Read it before asking for any art, because what is asked for decides how
much of the rest is easy.

## The three screens

Every game has the same three, and the canvas owns the moves between them. A game supplies the
art and the board.

- **Start.** The game's title, or its masthead drawn into the scene, then the seats (wrapping
  to a second row on a phone), the player count for a group's manager, the game's settings if it
  has any, and one action, with the bot offered beside it. This is where people gather and agree
  to play. Its controls sit on a wash of the game's `shade` rather than a card, so they read on
  any art without boxing the scene in.
- **Game.** The title shrinks into the bar, the players move up into a header with their pieces,
  and the board takes the space.
- **Result.** The final board stays on screen with the winning line drawn over it, and a panel
  rises underneath with who won and the running score for that chat.

Two things that are easy to get wrong:

- **Do not replace the board with a card when a game ends.** The board is the result. Keep it and
  put the panel below it.
- **The result waits for a person, never a timer.** It holds until somebody asks for another game,
  so whoever looked away still sees what happened. Back steps away from that one result, and the
  store remembers it by when the game ended, so closing and reopening the panel does not bring it
  back.

**Pieces are drawn, never typed.** A seat showing the letter X next to a carved X on the board
looks like two different games. Draw the piece once and use that everywhere it appears, at
whatever size. A mark that stands for a person, such as Dots and Boxes writing an owner's initial
in their colour, reads the same letter to everyone, so it uses their real name, never "You".

## Sound

Sound effects are generated in the browser rather than shipped as files, so effects add no audio
to the repo and no new dependency. Each game has its own move sound, so two games never sound
alike: tic-tac-toe chalks a mark, Dots and Boxes draws a pencil line and chimes when a box closes.
The canvas plays the turn, win, loss and draw cues for every game.

A level nobody has set yet means its default, not silence. `Number(JSON.parse(null))` is `0`, so a
missing volume read straight from storage mutes everything while the slider shows it full.

Browsers refuse to play anything until the person has interacted with the page, so the first
sound in a session may be dropped. That is fine and needs no handling.

Effects and music have separate levels in the sound menu, and the app's own sound setting still
silences both. Music fades in and out rather than starting at full volume.

### Music

Every game gets its own track, so one game never sounds like another.

**Look for open-source music and hand over links to listen to.** Nobody can judge a track from a
description, and the person choosing it is not the person searching for it. So the search ends in
a short list of links that play in a browser, not in a file already committed.

**CC0 or public domain only.** Whisprl is CC0 and both manifests declare it, so a track under any
other licence, however freely given, would mean a notices file and a README that no longer says
the repo is CC0. Open the licence on each track's own page and read it: a "royalty free" badge is
not a licence. Record the title, author and source next to the track where it is declared.

**Watch the weight.** A published track is a few megabytes, far past everything else a game ships.
Re-encode to mono AAC at a low bitrate, which CC0 allows, and expect a couple of minutes of music
to land near three quarters of a megabyte even then. AAC rather than Opus, because iOS Safari is
unreliable with Opus. Music is off by default and the file is fetched only when someone turns it
on, so nobody who leaves it off ever downloads it.

## Before it ships

- `scripts/check.sh` passes, judged on its exit code.
- The rules and the bot have tests.
- The board has been checked at the panel's smallest width, its largest, and at phone size. A
  board sized by width alone overflows a short panel, so size it against both.
- Art placed in the scene has been checked by overlay against the design, and the start screen fits
  without scrolling on a 390 by 844 phone under device emulation.
- The bot has been played against a practised and a casual player, and its rates are reasonable.
- Nothing in the panel scrolls sideways at any width.
- Reduced motion is respected.
- The game is playable with a keyboard and every control has a label.
