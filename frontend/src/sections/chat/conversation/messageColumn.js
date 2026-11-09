// room on the left for the sender's photo beside a group message, and the plain gap on the right
export const PHOTO_GUTTER = 56;
export const EDGE_GUTTER = { xs: 20, md: 32 };

// a centred note or day label gives back the photo gutter's extra width, so it sits in the middle of the chat
export const CENTRED = { ml: { xs: `${EDGE_GUTTER.xs - PHOTO_GUTTER}px`, md: `${EDGE_GUTTER.md - PHOTO_GUTTER}px` } };
