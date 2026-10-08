import { useRef, useState } from "react";

const CENTRE_SNAP = 0.02;
const QUARTER_TURN = Math.PI / 2;
const RIGHT_ANGLE_SNAP = (5 * Math.PI) / 180;
const TAP_SLOP = 5;
const SWIPE = 60;
const BIN_REACH = 44;
export const BIN_LIFT = 48;
export const binOf = (size) => ({ x: size.width / 2, y: size.height - BIN_LIFT });
const SCALES = { min: 0.25, max: 8 };

const distance = (from, to) => Math.hypot(to.x - from.x, to.y - from.y);
const angle = (from, to) => Math.atan2(to.y - from.y, to.x - from.x);
const middle = (one, other) => ({ x: (one.x + other.x) / 2, y: (one.y + other.y) / 2 });
const scaled = (scale, ratio) => Math.min(SCALES.max, Math.max(SCALES.min, scale * ratio));
const snappedToCentre = (value) => (Math.abs(value - 0.5) < CENTRE_SNAP ? 0.5 : value);

const nearestRightAngle = (rotation) => Math.round(rotation / QUARTER_TURN) * QUARTER_TURN;
const isRightAngle = (rotation) => rotation === nearestRightAngle(rotation);
const snappedToRightAngle = (rotation) => {
  const nearest = nearestRightAngle(rotation);
  return Math.abs(rotation - nearest) < RIGHT_ANGLE_SNAP ? nearest : rotation;
};

const transformOf = ({ base, start, isHandle }, pointers, size) => {
  const ids = [...start.keys()];
  const [from, to] = [ids.map((id) => start.get(id)), ids.map((id) => pointers.get(id))];
  if (ids.length > 1) {
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

const pointOf = (event) => {
  const rect = event.currentTarget.getBoundingClientRect();
  return { x: event.clientX - rect.left, y: event.clientY - rect.top };
};

const useStageGestures = ({ size, layers, brush, onLiveStroke, onStrokeEnd, onLayerChange, onLayerRemove, onLayerTap, onSwipe }) => {
  const pointers = useRef(new Map());
  const gesture = useRef(null);
  const [drag, setDrag] = useState(null);

  // whenever a finger lands or lifts, the gesture restarts from where the layer is now
  const rebase = () => {
    gesture.current.base = layers.find((layer) => layer.id === gesture.current.id);
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
    if (gesture.current?.kind === "layer") return rebase();
    const layer = event.target.closest("[data-layer-id]");
    gesture.current = layer ? { kind: "layer", id: layer.dataset.layerId, isHandle: Boolean(event.target.closest("[data-handle]")) } : { kind: "swipe", from: point };
    if (layer) rebase();
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
    } else if (current?.kind === "swipe" && !isCancelled && onSwipe) {
      const point = pointOf(event);
      const [across, down] = [point.x - current.from.x, point.y - current.from.y];
      if (Math.abs(across) > SWIPE && Math.abs(across) > Math.abs(down) * 2) onSwipe(across < 0 ? 1 : -1);
    }
    pointers.current.clear();
    gesture.current = null;
  };

  return {
    drag,
    handlers: { onPointerDown, onPointerMove, onPointerUp: (event) => finish(event, false), onPointerCancel: (event) => finish(event, true) },
  };
};

export default useStageGestures;
