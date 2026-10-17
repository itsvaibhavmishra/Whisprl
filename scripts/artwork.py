#!/usr/bin/env python3
"""Placing a game's artwork where its design put it, by measuring rather than by eye.

docs/game-art.md walks through when to use each step. A spec file describes the design image, the
window of it to work in, and each piece with its landmarks; every output lands beside the spec.

    artwork.py grid <image> [--step 50]   a copy with a measuring grid, for reading coordinates
    artwork.py fit <spec.json>            place each piece from its landmarks, and say how well they agree
    artwork.py register <spec.json>       refine those places against the design's pixels
    artwork.py overlay <spec.json>        the placed pieces over the design, faded and side by side
    artwork.py css <spec.json>            the places as shares of the stage, for the game's json

Everything but register needs only ImageMagick. register also needs numpy, scipy and Pillow, and
imports them itself so the other steps never do.
"""

import json
import math
import subprocess
import sys
from pathlib import Path

# coarse to fine: a blurred match finds the right neighbourhood, a sharp one settles inside it
PASSES = {"edges": (4.0, 2.0, 1.2), "colour": (6.0, 3.5, 2.0)}
# how far each value may move in one unit of the optimiser, so scale and pixels move at a similar pace
STEPS = (0.02, 0.02, 0.02, 0.02, 4.0, 4.0)
# a similarity is a turn and a scale plus a shift, so these four values stand for the whole matrix
SIMILARITY = (0, 1, 4, 5)


def as_affine(values):
    return list(values)


def as_similarity(values):
    return [values[0], values[1], -values[1], values[0], values[2], values[3]]


def run(*command, capture=False):
    result = subprocess.run(command, check=True, capture_output=capture, text=True)
    return result.stdout if capture else None


def size_of(image):
    width, height = run("magick", "identify", "-format", "%w %h", str(image), capture=True).split()
    return int(width), int(height)


def load_spec(path):
    spec_path = Path(path).resolve()
    spec = json.loads(spec_path.read_text())
    folder = spec_path.parent
    spec["folder"] = folder
    spec["design"] = folder / spec["design"]
    for piece in spec["pieces"]:
        piece["image"] = folder / piece["image"]
        piece["size"] = size_of(piece["image"])
    window = spec.get("window")
    if window is None:
        width, height = size_of(spec["design"])
        spec["window"] = {"x": 0, "y": 0, "width": width, "height": height}
    spec.setdefault("scene", {}).setdefault("width", size_of(spec["design"])[0])
    return spec


def apply(matrix, point):
    """Where a point of a piece lands in the design, with matrix in CSS order a, b, c, d, e, f."""
    across_x, across_y, down_x, down_y, shift_x, shift_y = matrix
    point_x, point_y = point
    return across_x * point_x + down_x * point_y + shift_x, across_y * point_x + down_y * point_y + shift_y


def solve(rows, targets):
    """Least squares by the normal equations, small enough here that nothing faster is needed."""
    size = len(rows[0])
    normal = [[sum(row[left] * row[right] for row in rows) for right in range(size)] for left in range(size)]
    totals = [sum(row[index] * target for row, target in zip(rows, targets)) for index in range(size)]
    for column in range(size):
        pivot = max(range(column, size), key=lambda candidate: abs(normal[candidate][column]))
        normal[column], normal[pivot] = normal[pivot], normal[column]
        totals[column], totals[pivot] = totals[pivot], totals[column]
        for other in range(size):
            if other != column:
                factor = normal[other][column] / normal[column][column]
                normal[other] = [value - factor * base for value, base in zip(normal[other], normal[column])]
                totals[other] -= factor * totals[column]
    return [totals[index] / normal[index][index] for index in range(size)]


def describe(matrix):
    across_x, across_y, down_x, down_y, shift_x, shift_y = matrix
    scale_x, scale_y = math.hypot(across_x, across_y), math.hypot(down_x, down_y)
    rotation = math.degrees(math.atan2(across_y, across_x))
    shear = math.degrees(math.atan2(-down_x, down_y)) - rotation
    return f"scale {scale_x:.4f} x {scale_y:.4f}  rotation {rotation:+.2f}  shear {shear:+.2f}  at ({shift_x:.1f}, {shift_y:.1f})"


def grid(image, step):
    """A copy scaled to fit 800 wide, with a line every step source pixels and a heavier one every fifth."""
    width, height = size_of(image)
    scale = min(1.0, 800 / width)
    shown_width, shown_height = round(width * scale), round(height * scale)
    command = ["magick", str(image), "-resize", f"{shown_width}x{shown_height}!", "-background", "#B07D45", "-flatten", "-fill", "none"]
    for index, offset in enumerate(range(0, max(width, height), step)):
        heavy = index % 5 == 0
        command += ["-stroke", "rgba(255,255,0,0.95)" if heavy else "rgba(0,255,255,0.6)", "-strokewidth", "2" if heavy else "1"]
        position = round(offset * scale)
        if offset < width:
            command += ["-draw", f"line {position},0 {position},{shown_height}"]
        if offset < height:
            command += ["-draw", f"line 0,{position} {shown_width},{position}"]
    output = image.with_name(f"{image.stem}-grid.png")
    run(*command, str(output))
    print(f"{output}\n  a line every {step} source pixels, a yellow one every {step * 5}; shown at {scale:.3f} of full size")


def fit(spec):
    """A similarity per piece from its landmarks: one scale, one rotation and an offset, no stretching."""
    placements = {}
    for piece in spec["pieces"]:
        rows, targets = [], []
        for landmark in piece["landmarks"]:
            (asset_x, asset_y), (design_x, design_y) = landmark["asset"], landmark["design"]
            rows += [[asset_x, -asset_y, 1, 0], [asset_y, asset_x, 0, 1]]
            targets += [design_x, design_y]
        cosine, sine, shift_x, shift_y = solve(rows, targets)
        matrix = [cosine, sine, -sine, cosine, shift_x, shift_y]
        misses = [math.dist(apply(matrix, landmark["asset"]), landmark["design"]) for landmark in piece["landmarks"]]
        placements[piece["name"]] = matrix
        print(f"{piece['name']:<10} {describe(matrix)}  landmarks off by {sum(misses) / len(misses):.1f}px on average, {max(misses):.1f} at most")
    write(spec, "placement.fit.json", placements)


def register(spec):
    """Each piece moved until its own pixels line up with the design's, starting from the landmark fit."""
    import numpy
    from PIL import Image
    from scipy import ndimage, optimize

    window = spec["window"]
    luma = numpy.array([0.299, 0.587, 0.114], dtype=numpy.float32)
    design = numpy.asarray(Image.open(spec["design"]).convert("RGB"), dtype=numpy.float32) / 255
    design = design[window["y"]:window["y"] + window["height"], window["x"]:window["x"] + window["width"]]
    design_luma = design @ luma

    def warp(channel, matrix):
        """The piece drawn into the window, matrix in design pixels, so the window's corner is taken off."""
        across_x, across_y, down_x, down_y, shift_x, shift_y = matrix
        shift_x, shift_y = shift_x - window["x"], shift_y - window["y"]
        inverse = numpy.linalg.inv(numpy.array([[across_x, down_x], [across_y, down_y]]))
        rows_from = numpy.array([[inverse[1, 1], inverse[1, 0]], [inverse[0, 1], inverse[0, 0]]])
        offset = -rows_from @ numpy.array([shift_y, shift_x])
        return ndimage.affine_transform(channel, rows_from, offset, output_shape=design_luma.shape, order=1, cval=0.0)

    def edges(image, blur):
        smooth = ndimage.gaussian_filter(image, blur)
        return numpy.hypot(ndimage.sobel(smooth, axis=1), ndimage.sobel(smooth, axis=0))

    def blurred(image, blur):
        return numpy.stack([ndimage.gaussian_filter(image[..., channel], blur) for channel in range(3)], axis=-1)

    placements = json.loads((spec["folder"] / "placement.fit.json").read_text())
    pixels = {piece["name"]: numpy.asarray(Image.open(piece["image"]).convert("RGBA"), dtype=numpy.float32) / 255 for piece in spec["pieces"]}

    # topmost first, so a piece that covers another is settled before it masks that one
    for piece in reversed(spec["pieces"]):
        name, rgba = piece["name"], pixels[piece["name"]]
        match = piece.get("match", "edges")
        hidden = numpy.zeros(design_luma.shape, dtype=bool)
        # what covers this piece in the design cannot vote on where it sits
        for cover in piece.get("hiddenBy", []):
            hidden |= ndimage.binary_dilation(warp(pixels[cover][..., 3], placements[cover]) > 0.2, iterations=6)

        def loss(matrix, blur):
            alpha = warp(rgba[..., 3], matrix)
            # edges near a piece's own outline are its silhouette, which the design may draw differently
            inside = ndimage.binary_erosion(alpha > 0.5, iterations=2 if match == "colour" else 4) & ~hidden
            if inside.sum() < 2000:
                return 10.0
            if match == "colour":
                mine = blurred(numpy.stack([warp(rgba[..., channel], matrix) for channel in range(3)], axis=-1), blur)
                return float(((mine - blurred(design, blur)) ** 2).sum(axis=-1)[inside].mean())
            mine = edges(warp(rgba[..., :3] @ luma, matrix), blur)[inside]
            theirs = edges(design_luma, blur)[inside]
            mine, theirs = mine - mine.mean(), theirs - theirs.mean()
            return -float((mine * theirs).sum() / (numpy.sqrt((mine ** 2).sum() * (theirs ** 2).sum()) + 1e-9))

        # a similarity keeps the piece's own proportions; affine may also stretch or lean it, never right for lettering
        kept, pack = (range(6), as_affine) if piece.get("shape") == "affine" else (SIMILARITY, as_similarity)
        current = numpy.array([placements[name][index] for index in kept])
        scaled = numpy.array([STEPS[index] for index in kept])
        before = loss(pack(current), PASSES[match][1])
        for blur in PASSES[match]:
            result = optimize.minimize(lambda moves: loss(pack(current + moves * scaled), blur), numpy.zeros_like(current),
                                       method="Powell", options={"xtol": 0.05, "ftol": 1e-6, "maxfev": 800})
            current = current + result.x * scaled
        placements[name] = [float(value) for value in pack(current)]
        after = loss(placements[name], PASSES[match][1])
        measure = "colour error" if match == "colour" else "edge mismatch"
        print(f"{name:<10} {measure} {before:+.3f} -> {after:+.3f}  {describe(placements[name])}")
    write(spec, "placement.json", placements)


def overlay(spec, which):
    """The pieces drawn in order over the design's window: once faded to half, once beside the design."""
    placements = json.loads((spec["folder"] / which).read_text())
    window = spec["window"]
    frame = f"{window['width']}x{window['height']}"
    command = ["magick", "-size", frame, "xc:none"]
    for piece in spec["pieces"]:
        across_x, across_y, down_x, down_y, shift_x, shift_y = placements[piece["name"]]
        projection = f"{across_x},{across_y},{down_x},{down_y},{shift_x - window['x']},{shift_y - window['y']}"
        command += ["(", str(piece["image"]), "-virtual-pixel", "transparent", "-define", f"distort:viewport={frame}+0+0",
                    "-distort", "AffineProjection", projection, ")", "-composite"]
    folder = spec["folder"]
    run(*command, str(folder / "overlay-pieces.png"))
    crop = f"{frame}+{window['x']}+{window['y']}"
    run("magick", str(spec["design"]), "-crop", crop, "+repage", str(folder / "overlay-design.png"))
    run("magick", str(folder / "overlay-design.png"), "(", str(folder / "overlay-pieces.png"), "-channel", "A", "-evaluate", "multiply", "0.5", "+channel", ")",
        "-composite", str(folder / "overlay-ghost.png"))
    run("magick", str(folder / "overlay-design.png"), "(", "-size", frame, "xc:#3a2a1c", str(folder / "overlay-pieces.png"), "-composite", ")",
        "+append", str(folder / "overlay-side.png"))
    print(f"{folder / 'overlay-ghost.png'}\n  anything drawn twice is out of place\n{folder / 'overlay-side.png'}\n  the design, then the pieces alone")


def css(spec):
    """Each place as shares of the stage: the scene's top band, down to the lowest corner of any piece."""
    placements = json.loads((spec["folder"] / "placement.json").read_text())
    scene_width = spec["scene"]["width"]
    corners = []
    for piece in spec["pieces"]:
        width, height = piece["size"]
        corners += [apply(placements[piece["name"]], corner) for corner in ((0, 0), (width, 0), (0, height), (width, height))]
    stage_height = max(corner_y for _, corner_y in corners)
    layout = {"stage": {"width": scene_width, "height": round(stage_height, 1)}}
    for piece in spec["pieces"]:
        across_x, across_y, down_x, down_y, shift_x, shift_y = placements[piece["name"]]
        unit = math.hypot(across_x, across_y)
        layout[piece["name"]] = {
            "left": round(100 * shift_x / scene_width, 2),
            "top": round(100 * shift_y / stage_height, 2),
            "width": round(100 * piece["size"][0] * unit / scene_width, 2),
            "matrix": [round(value / unit, 4) for value in (across_x, across_y, down_x, down_y)],
        }
    print(json.dumps(layout, indent=2))


def write(spec, name, placements):
    path = spec["folder"] / name
    path.write_text(json.dumps(placements, indent=2))
    print(f"wrote {path}")


def main(arguments):
    if len(arguments) < 2:
        print(__doc__)
        return 1
    command, target = arguments[0], Path(arguments[1])
    if command == "grid":
        step = int(arguments[arguments.index("--step") + 1]) if "--step" in arguments else 50
        grid(target, step)
    elif command in ("fit", "register", "overlay", "css"):
        spec = load_spec(target)
        if command == "overlay":
            which = "placement.json" if (spec["folder"] / "placement.json").exists() else "placement.fit.json"
            overlay(spec, which)
        else:
            {"fit": fit, "register": register, "css": css}[command](spec)
    else:
        print(__doc__)
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
