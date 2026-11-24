export const SIGN_WIDTH = 40   // canvas pixels
export const SIGN_CELL = 30    // canvas pixels of height per character
export const SIGN_PADDING = 12

/** Width divided by height of a sign for a word, so the board is not stretched. */
export const signAspect = (text: string) => SIGN_WIDTH / (SIGN_PADDING + [...text].length * SIGN_CELL)
