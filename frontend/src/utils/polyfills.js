// a phone whose WebView was never updated lacks these, and Whisprl and its libraries call them from the first screen
const fillIn = (prototype, name, method) => {
  if (!(name in prototype)) Object.defineProperty(prototype, name, { value: method, writable: true, configurable: true });
};

function at(index) {
  const position = Math.trunc(index) || 0;
  return this[position < 0 ? this.length + position : position];
}

function findLastIndex(test, thisArg) {
  for (let position = this.length - 1; position >= 0; position -= 1) {
    if (test.call(thisArg, this[position], position, this)) return position;
  }
  return -1;
}

function findLast(test, thisArg) {
  const position = findLastIndex.call(this, test, thisArg);
  return position < 0 ? undefined : this[position];
}

// only the single radius Whisprl passes, which is all the editor's text boxes need
function roundRect(left, top, width, height, radius) {
  const corner = Math.min(radius, width / 2, height / 2);
  this.moveTo(left + corner, top);
  this.arcTo(left + width, top, left + width, top + height, corner);
  this.arcTo(left + width, top + height, left, top + height, corner);
  this.arcTo(left, top + height, left, top, corner);
  this.arcTo(left, top, left + width, top, corner);
  this.closePath();
}

fillIn(Array.prototype, "at", at);
fillIn(String.prototype, "at", at);
fillIn(Array.prototype, "findLast", findLast);
fillIn(Array.prototype, "findLastIndex", findLastIndex);
fillIn(Object, "hasOwn", (object, key) => Object.prototype.hasOwnProperty.call(object, key));
fillIn(CanvasRenderingContext2D.prototype, "roundRect", roundRect);
