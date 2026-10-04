/**
 * Keep a menu inside the viewport: flip it to the left/top of the cursor when it does not fit
 *
 * @export
 * @param {number} x cursor x
 * @param {number} y cursor y
 * @param {{width:number,height:number}} menu menu size
 * @param {{width:number,height:number}} viewport viewport size
 * @returns {{x:number,y:number}} menu position
 */
export function clampMenuPosition(x, y, menu, viewport) {
  let left = x + menu.width > viewport.width ? x - menu.width : x;
  let top = y + menu.height > viewport.height ? y - menu.height : y;
  left = Math.max(0, Math.min(left, viewport.width - menu.width));
  top = Math.max(0, Math.min(top, viewport.height - menu.height));
  return { x: left, y: top };
}
