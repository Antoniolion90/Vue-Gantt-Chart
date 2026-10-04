// Height of a mark line label, px (0.7rem text with 3px padding)
export const LABEL_HEIGHT = 20;

// Approximate width of one label character, px; slightly larger than the real one
const CHAR_WIDTH = 7;
const LABEL_PADDING = 6;

/**
 * Approximate label width: optional text, a space and the HH:mm:ss time
 *
 * @export
 * @param {{text?:string}} timeConfig
 * @returns {number} width, px
 */
export function estimateLabelWidth(timeConfig) {
  const chars = (timeConfig.text ? timeConfig.text.length + 1 : 0) + "HH:mm:ss".length;
  return chars * CHAR_WIDTH + LABEL_PADDING;
}
