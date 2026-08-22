/**
 * The one measure every chrome row and the page content share.
 *
 * The header used to stretch edge to edge while `main` was capped and
 * centred, so on a wide display the run badges sat ~400px to the left of the
 * page title they describe, and the health readout hugged the far right. Two
 * different left edges on the same screen read as a layout bug, because it
 * is one. Any full-bleed bar (background and bottom hairline spanning the
 * viewport) must put this on its inner wrapper so its contents line up with
 * the column below.
 */
export const SHELL_WIDTH = "mx-auto w-full max-w-[1600px] px-4 sm:px-6 lg:px-8";
