export const SPLASH_NATIVE_FADE_MS = 120;
export const NATIVE_HANDOFF_MS = 0;
export const SPLASH_INTRO_MS = 320;
export const SPLASH_STORY_DURATION_MS = 760;
export const SPLASH_FADE_DURATION_MS = 300;
export const SPLASH_REDUCED_EXIT_MS = 200;
export const HOME_REVEAL_DELAY_MS = 280;

export const SPLASH_TIMELINE = {
  dropEnd: 0.29,
  absorbEnd: 0.4,
  squashStart: 0.29,
  squashEnd: 0.44,
  inflateStart: 0.44,
  inflateEnd: 0.74,
  exitStart: 0.84,
  exitEnd: 0.99,
  bodyFadeStart: 0.9,
  bodyFadeEnd: 1,
  impactEnd: 0.46,
  backgroundFadeStart: 0.55,
  backgroundFadeEnd: 0.96,
} as const;
