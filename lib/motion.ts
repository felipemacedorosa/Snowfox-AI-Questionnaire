import type { Variants, Transition } from "motion/react";

/** Shared easing curves — mirror the CSS custom properties in globals.css. */
export const EASE_OUT = [0.22, 1, 0.36, 1] as const;
export const EASE_IN = [0.4, 0, 1, 1] as const;
export const EASE_INOUT = [0.32, 0.72, 0, 1] as const;

/** Selection / node pops. */
export const SPRING_POP: Transition = { type: "spring", stiffness: 420, damping: 30 };

/** Standard scroll-reveal viewport config: fire once, slightly before entering. */
export const VIEWPORT_ONCE = { once: true, margin: "-80px" } as const;

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE_OUT } },
};

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.4, ease: EASE_OUT } },
};

/** Parent container that staggers `fadeUp`/`fadeIn` children. */
export function staggerChildren(stagger = 0.08, delay = 0): Variants {
  return {
    hidden: {},
    visible: { transition: { staggerChildren: stagger, delayChildren: delay } },
  };
}

/**
 * Quiz step transitions — direction-aware horizontal slide.
 * `custom` is the navigation direction: 1 (forward) or -1 (back).
 */
export const stepVariants: Variants = {
  enter: (direction: number) => ({
    opacity: 0,
    x: direction >= 0 ? 32 : -32,
  }),
  center: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.38, ease: EASE_OUT },
  },
  exit: (direction: number) => ({
    opacity: 0,
    x: direction >= 0 ? -24 : 24,
    transition: { duration: 0.24, ease: EASE_IN },
  }),
};

/** Screen-level transition (landing ↔ quiz ↔ results). */
export const screenVariants: Variants = {
  enter: { opacity: 0, y: 18 },
  center: { opacity: 1, y: 0, transition: { duration: 0.45, ease: EASE_OUT } },
  exit: { opacity: 0, transition: { duration: 0.24, ease: EASE_IN } },
};
