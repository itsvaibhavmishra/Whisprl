import { useRef, useState } from "react";

import { CONTAINED_PHOTO } from "@/utils/media-editor/draw";

const CENTRE_SNAP = 0.02;
const QUARTER_TURN = Math.PI / 2;
const RIGHT_ANGLE_SNAP = (5 * Math.PI) / 180;
const TAP_SLOP = 5;
const SWIPE = 60;
const BIN_REACH = 44;
export const BIN_LIFT = 48;
export const binOf = (size) => ({ x: size.width / 2, y: size.height - BIN_LIFT });
const SCALES = { min: 0.25, max: 8 };
const PHOTO_SCALES = { min: 0.5, max: 4 };
const WHEEL_ZOOM = 0.0015;
const PINCH_ZOOM = 0.01;

const distance = (from, to) => Math.hypot(to.x - from.x, to.y - from.y);
const angle = (from, to) => Math.atan2(to.y - from.y, to.x - from.x);
const middle = (one, other) => ({ x: (one.x + other.x) / 2, y: (one.y + other.y) / 2 });
const clamped = (value, limits) => Math.min(limits.max, Math.max(limits.min, value));
export const scaled = (scale, ratio) => clamped(scale * ratio, SCALES);
const snappedToCentre = (value) => (Math.abs(value - 0.5) < CENTRE_SNAP ? 0.5 : value);

const nearestRightAngle = (rotation) => Math.round(rotation / QUARTER_TURN) * QUARTER_TURN;
const isRightAngle = (rotation) => rotation === nearestRightAngle(rotation);
const snappedToRightAngle = (rotation) => {
  const nearest = nearestRightAngle(rotation);
  return Math.abs(rotation - nearest) < RIGHT_ANGLE_SNAP ? nearest : rotation;
};

const endsOf = (start, pointers) => {
  const ids = [...start.keys()];
  return [ids.map((id) => start.get(id)), ids.map((id) => pointers.get(id))];
};

const transformOf = ({ base, start, isHandle }, pointers, size) => {
  const [from, to] = endsOf(start, pointers);
  if (from.length > 1) {
    const [before, after] = [middle(from[0], from[1]), middle(to[0], to[1])];
    return {
      x: snappedToCentre(base.x + (after.x - before.x) / size.width),
      y: snappedToCentre(base.y + (after.y - before.y) / size.height),
      scale: scaled(base.scale, distance(to[0], to[1]) / distance(from[0], from[1])),
      rotation: snappedToRightAngle(base.rotation + angle(to[0], to[1]) - angle(from[0], from[1])),
    };
  }
  if (isHandle) {
    const centre = { x: base.x * size.width, y: base.y * size.height };
    return { scale: scaled(base.scale, distance(centre, to[0]) / distance(centre, from[0])), rotation: snappedToRightAngle(base.rotation + angle(centre, to[0]) - angle(centre, from[0])) };
  }
  return { x: snappedToCentre(base.x + (to[0].x - from[0].x) / size.width), y: snappedToCentre(base.y + (to[0].y - from[0].y) / size.height) };
};

const movedOffset = (offset, from, to, grown, length) => {
  const centre = (0.5 + offset) * length;
  return snappedToCentre((to + (centre - from) * grown) / length) - 0.5;
};

// the point under the pointer at the start stays under it at the end, which zooms around the pointer or the pinch
const placedPhoto = (base, from, to, ratio, size) => {
  const scale = clamped(base.scale * ratio, PHOTO_SCALES);
  const grown = scale / base.scale;
  return { x: movedOffset(base.x, from.x, to.x, grown, size.width), y: movedOffset(base.y, from.y, to.y, grown, size.height), scale };
};

const photoTransformOf = ({ base, start }, pointers, size) => {
  const [from, to] = endsOf(start, pointers);
  if (from.length > 1) return placedPhoto(base, middle(from[0], from[1]), middle(to[0], to[1]), distance(to[0], to[1]) / distance(from[0], from[1]), size);
  return placedPhoto(base, from[0], to[0], 1, size);
};

const pointOf = (event) => {
  const rect = event.currentTarget.getBoundingClientRect();
  return { x: event.clientX - rect.left, y: event.clientY - rect.top };
};

const useStageGestures = ({ size, layers, photo = CONTAINED_PHOTO, brush, onLiveStroke, onStrokeEnd, onLayerChange, onLayerRemove, onLayerTap, onSwipe, onPhotoChange }) => {
  const pointers = useRef(new Map());
  const gesture = useRef(null);
  const [drag, setDrag] = useState(null);

  // whenever a finger lands or lifts, the gesture restarts from where the layer or photo is now
  const rebase = () => {
    gesture.current.base = gesture.current.kind === "photo" ? photo : layers.find((layer) => layer.id === gesture.current.id);
    gesture.current.start = new Map([...pointers.current].slice(0, 2));
  };

  const onPointerDown = (event) => {
    if (event.button > 0 || (brush && gesture.current)) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    const point = pointOf(event);
    pointers.current.set(event.pointerId, point);
    if (brush) {
      gesture.current = { kind: "stroke", stroke: { brush: brush.name, color: brush.color, size: brush.size, points: [[point.x / size.width, point.y / size.height]] } };
      onLiveStroke(gesture.current.stroke);
      return;
    }
    if (gesture.current?.kind === "layer" || gesture.current?.kind === "photo") return rebase();
    if (gesture.current?.kind === "swipe" && onPhotoChange) {
      gesture.current = { kind: "photo" };
      return rebase();
    }
    const layer = event.target.closest("[data-layer-id]");
    if (layer) gesture.current = { kind: "layer", id: layer.dataset.layerId, isHandle: Boolean(event.target.closest("[data-handle]")) };
    // a mouse has the filter strip, so on the photo it moves the photo rather than swiping filters
    else if (event.pointerType === "mouse" && onPhotoChange) gesture.current = { kind: "photo" };
    else gesture.current = { kind: "swipe", from: point };
    if (gesture.current.kind !== "swipe") rebase();
  };

  const onPointerMove = (event) => {
    if (!pointers.current.has(event.pointerId)) return;
    const point = pointOf(event);
    pointers.current.set(event.pointerId, point);
    const current = gesture.current;
    if (current?.kind === "stroke") {
      current.stroke.points.push([point.x / size.width, point.y / size.height]);
      onLiveStroke(current.stroke);
      return;
    }
    if (current?.kind === "photo") {
      const placed = photoTransformOf(current, pointers.current, size);
      onPhotoChange(placed);
      setDrag({ guides: { x: placed.x === 0, y: placed.y === 0 } });
      return;
    }
    if (current?.kind !== "layer" || !current.base) return;
    current.hasMoved ||= [...current.start].some(([id, from]) => pointers.current.has(id) && distance(from, pointers.current.get(id)) > TAP_SLOP);
    if (!current.hasMoved) return;
    const patch = transformOf(current, pointers.current, size);
    onLayerChange(current.id, patch);
    current.isOverBin = pointers.current.size === 1 && !current.isHandle && distance(point, binOf(size)) < BIN_REACH;
    setDrag({ id: current.id, canBin: !current.isHandle, isOverBin: current.isOverBin, guides: { x: patch.x === 0.5, y: patch.y === 0.5, turn: "rotation" in patch && isRightAngle(patch.rotation) } });
  };

  const finish = (event, isCancelled) => {
    if (!pointers.current.delete(event.pointerId)) return;
    const current = gesture.current;
    if (current?.kind === "stroke") {
      onStrokeEnd(isCancelled ? null : current.stroke);
    } else if (current?.kind === "layer") {
      if (pointers.current.size) return rebase();
      if (!isCancelled && current.isOverBin) onLayerRemove(current.id);
      else if (!isCancelled && !current.hasMoved) onLayerTap(current.id);
      setDrag(null);
    } else if (current?.kind === "photo") {
      if (pointers.current.size) return rebase();
      setDrag(null);
    } else if (current?.kind === "swipe" && !isCancelled && onSwipe) {
      const point = pointOf(event);
      const [across, down] = [point.x - current.from.x, point.y - current.from.y];
      if (Math.abs(across) > SWIPE && Math.abs(across) > Math.abs(down) * 2) onSwipe(across < 0 ? 1 : -1);
    }
    pointers.current.clear();
    gesture.current = null;
  };

  // a trackpad pinch arrives as a wheel turned with ctrl held, in much smaller steps than a mouse wheel's
  const onWheel = (event) => {
    if (brush || gesture.current) return;
    const point = pointOf(event);
    onPhotoChange(placedPhoto(photo, point, point, Math.exp(-event.deltaY * (event.ctrlKey ? PINCH_ZOOM : WHEEL_ZOOM)), size));
  };

  return {
    drag,
    onWheel: onPhotoChange && onWheel,
    handlers: { onPointerDown, onPointerMove, onPointerUp: (event) => finish(event, false), onPointerCancel: (event) => finish(event, true) },
  };
};

export default useStageGestures;
