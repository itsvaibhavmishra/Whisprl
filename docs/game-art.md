# Game artwork

How a game's art is asked for, cut out and put where its design says it goes. Where these steps
sit in building a game is in [games.md](games.md). Placing art uses `scripts/artwork.py`.

## The design prompt

A game's screens are designed before its art exists, and whoever designs them does not have this
repository in their head. So each game gets three short prompts, one per screen, handed over one
at a time rather than all at once, because the game screen is worth settling before the finished
screen is drawn over it.

**Ask for the whole screen, every time.** A prompt that holds pieces back to protect the later
cut-out returns a screen nobody can judge, and the point of this step is to see the game before
it is built. Describe the screen in full and let the artwork come back whole.

Every prompt says:

- **What the game is**, in one sentence, and how a turn works.
- **What is on this screen**, top to bottom, in the order it is stacked, naming every element.
- **How it behaves**: what changes as people take seats, choose settings and play, since a
  screen drawn without its states is a screen that only works empty.
- **The frame**: phone portrait, and that the top and bottom strips stay visually quiet, because
  the control bar sits at the top and the buttons sit at the bottom.
- **The size**, at twice the largest the panel goes.

The cut-out comes later, from the finished design, and the art is then re-asked for in pieces
once the screen is agreed. Keep that worry out of the design prompt.

## Asking for the pieces

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

## Cutting the background out

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

Trim each piece to its own bounds, then export as WebP and compress it as far as it goes without
showing. Compare the same crop at 100% across a few qualities rather than trusting a number: on
Dots and Boxes, quality 80 could not be told from 92 on hatched lettering or fur, and a flat
paper board held at 74. `-define webp:method=6` costs nothing at runtime and shrinks every file.

## Slicing one image into pieces

Art that animates in parts, such as a title whose words drop in one at a time, arrives as one
image with gaps. Find the gaps by reading a column profile of the alpha channel rather than by
eye, cut each piece to its own bounds, and store each piece's position as a **fraction of the
whole**, so the pieces hold together at any size.

Then **reassemble the pieces and compare against the original**. `magick compare -metric AE`
should report zero differing pixels. If it does not, the recorded positions are wrong and
everything placed with them will be wrong too.

**Slice only for a reason.** A piece has to move or animate on its own to earn its own file. A
prop drawn into a bigger piece a little off from where the design put it stays where it is: the
aim is a screen that reads like the design, not a copy of it, and every file is another request.

## Measuring a board

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

A board that holds a grid drawn in code, as Dots and Boxes does, is checked the same way: draw the
grid at every size the game offers over the board and look for the board's own texture fighting
it.

## Placing pieces against the design

The design is the record of where every piece goes, so places are measured off it rather than
chosen. Five steps, each one command, and the result is a json file the game reads.

### The design is the scene

A screen's design is the scene at the same width with the interface drawn over it. Its pixels are
the scene's pixels: a cat whose paws rest at y 335 on the design rests at y 335 on the scene.
Measure on the design and the measurement holds on the scene, at whatever size the scene is drawn.

Work inside a window of the design that holds the pieces, rather than the whole screen, so every
step looks only at what matters.

### 1. Read coordinates off a grid

```sh
python3 scripts/artwork.py grid design.png --step 50
python3 scripts/artwork.py grid cat.png --step 100
```

Each writes a copy beside the original with a line every step in the source's own pixels and a
heavier one every fifth. Read **landmarks** off them: points that are unmistakable in both the
piece and the design, spread across the piece, three to seven per piece.

Good landmarks are an eye, an ear tip, a node of a drawn square, the point of a pencil, the face
printed on a mug. Poor ones are the middle of a flat area or anywhere along an edge, since a point
that can slide along a line cannot be pinned to one spot.

### 2. Fit from the landmarks

A spec file names the design, the window and each piece in drawing order, with its landmarks in
the piece's pixels and the design's pixels:

```json
{
  "design": "design.png",
  "window": { "x": 90, "y": 130, "width": 760, "height": 640 },
  "pieces": [
    {
      "name": "notebook", "image": "notebook.png", "match": "edges", "shape": "affine", "hiddenBy": ["title", "cat"],
      "landmarks": [
        { "asset": [1036, 150], "design": [635, 345], "what": "cat face on the mug" },
        { "asset": [610, 864], "design": [452, 706], "what": "pencil tip" }
      ]
    },
    { "name": "title", "image": "title.png", "match": "colour", "landmarks": [] },
    { "name": "cat", "image": "cat.png", "landmarks": [] }
  ]
}
```

```sh
python3 scripts/artwork.py fit spec.json
```

This places each piece with one scale, one rotation and an offset, the least-squares best for its
landmarks, and reports how far the landmarks still miss. **A few pixels means the piece is the
design's piece. More than ten means the design drew it differently**, from another angle or with
its parts laid out another way, and the next step matters more.

### 3. Refine against the pixels

```sh
python3 scripts/artwork.py register spec.json
```

Landmarks are read by eye, so this moves each piece until its own pixels line up with the
design's, starting from the fit. Each piece says how to compare:

- **`"match": "edges"`**, the default, compares the shapes inside the piece, so the design's
  lighting does not throw it. Use it for pieces drawn the same way in both.
- **`"match": "colour"`** compares blurred colour instead, for a piece the design drew
  differently. Dots and Boxes' lettering is flat with stitched outlines in the design and hatched
  crayon in the cut-out, so their edges disagree everywhere: an edge match wandered off, a colour
  match lined the letters up by their shapes.

And how far it may move:

- **`"shape": "similarity"`**, the default, keeps the piece's proportions.
- **`"shape": "affine"`** may also stretch and lean it, for a prop drawn from a slightly different
  angle. **Never for lettering**: given that freedom, an edge match on the title sheared it by
  nine degrees chasing texture.
- **`"hiddenBy"`** names the pieces that cover this one in the design, so the covered part does
  not vote. A blank page cannot match a page with a title written on it.

Pieces are refined topmost first, so anything covering another settles before it masks it. The
report gives each piece's edge mismatch, lower is better, or colour error, before and after.

### 4. Look at it

```sh
python3 scripts/artwork.py overlay spec.json
```

`overlay-ghost.png` draws the pieces at half strength over the design, so **anything drawn twice
is out of place**. `overlay-side.png` puts the design beside the pieces on their own. Judge it as
someone looking at the screen would: Dots and Boxes kept a doubled mug and eraser, which the
cut-out draws a little off from the design, because the pad around them lines up and cutting them
loose was not worth another two files.

### 5. Turn it into CSS

```sh
python3 scripts/artwork.py css spec.json > masthead.json
```

The output is a **stage**, the top band of the scene down to the lowest piece, and each piece's
`left`, `top` and `width` as percentages of it with a 2 by 2 `matrix`. The component places each
piece with `position: absolute`, those three percentages, `transform: matrix(a, b, c, d, 0, 0)`
and `transform-origin: 0 0`. The matrix carries the rotation and any stretch and has no units, so
it holds at any size while the percentages scale with the stage.

### Pin the scene to the stage

The stage lines up only if the scene is drawn the same way: from the top, at the stage's width. A
game whose art is placed this way sets **`anchor: "top"`** and the scene's `ratio` (width over
height) on its art. The canvas then picks one width for both, from the panel's size and the
controls' measured height:

- as wide as the panel, so a phone shows the scene edge to edge;
- narrower when a wide panel would make the masthead so tall the controls fall off the screen,
  with the scene blurred behind it to fill the sides;
- wider than the panel, cropped evenly at both sides, when a tall panel would otherwise run out
  of scene before the bottom.

A scene fitted by plain cover, or anchored to the bottom, moves as the panel changes shape, and
every piece drifts off the spot it was measured to.

For the same reason the stage is the first thing on its screen and nothing above it takes space.
The game's bar floats over the start screen rather than sitting in a row of its own.

A piece of the stage that animates is loaded lazily, like the board, and the game declares the
stage's ratio so the screen holds its place while it loads. Importing an animation library from a
game's `index.js` pulls it into everything that reads the catalog, including tests that cannot
parse it.

### Worked example: Dots and Boxes

| Piece | Landmarks | Missed by | Refined by | Then |
|---|---|---|---|---|
| Cat | ears, eyes, nose, paws | 4.2px | edges, similarity | edge match 0.56 to 0.73 |
| Title | crown, square's nodes, foot of the B | 7.4px | colour, similarity | colour error 0.30 to 0.25 |
| Notebook | mug, eraser, pencil, spiral | 11.3px | edges, affine, under the others | edge match 0.34 to 0.57 |

The result puts the cat's paws at y 328 to 336 of the scene and its chin at 350, on the desk's
back edge, with the pad lying in front of it, as the design has them.

## Fitting the screen around the art

**The design is a full screen; the game is not.** The chat's header sits above the game, and the
chat's thin peek and composer below it, so a phone gives the game less height than the design
shows. On a 390 by 844 phone the start screen has about 660px against the design's 760.

- **The art keeps its place and the interface gives.** Pinned art cannot shrink to make room, so
  the room comes from the controls. Measure the design's controls at the same width first: on
  Dots and Boxes the column is three quarters of the width and the two actions about half, and
  matching those proportions recovered most of the space before any spacing was touched.
- **Copy can be the overflow.** A note that wraps to a second line costs a line's height. The
  design's shorter wording fitted on one.
- **The game knows how much of it the chat covers.** The canvas measures the composer as it really
  is, since a reply quote or the encryption notice makes it taller, adds the peek and the caret,
  and sets `--chat-overlay`. Keep everything the game needs above it.
- **Measure, then look.** Read element boxes in the browser at the design's width and compare
  them with the design's, and read overflow as `scrollHeight - clientHeight` on the screen's
  scroller. A screenshot taken mid-animation looks broken when it is not.
- **Check at a real phone width.** Chrome will not shrink a window below about 500px, so a window
  resized to 390 is still 500 wide. Use device emulation at 390 by 844, and say which was used.
  Then check a chat showing the encryption notice, the tallest the composer gets.

## Tools

- **ImageMagick** for every step.
- **Python 3** for `scripts/artwork.py`.
- **numpy, scipy and Pillow** for `register` only, in a virtual environment outside the repo:

```sh
python3 -m venv ~/.venvs/whisprl-art
~/.venvs/whisprl-art/bin/pip install numpy scipy pillow
~/.venvs/whisprl-art/bin/python scripts/artwork.py register spec.json
```

They are not project dependencies. Nothing in the app, the gate or CI uses them, and `register`
imports them itself so the other steps never need them.

Keep the spec and the source images with the art's working files, not in the repo: only the
exported WebP and the resulting json are committed.
