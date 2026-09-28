/**
 * --------------------------------------------------------------------------
 * Chassis CSS util/index.ts
 * Licensed under MIT (https://github.com/chassis-ui/css/blob/main/LICENSE)
 * --------------------------------------------------------------------------
 */
declare const ESCAPE_KEY = "Escape";
declare const TAB_KEY = "Tab";
declare const ENTER_KEY = "Enter";
declare const SPACE_KEY = " ";
declare const BACKSPACE_KEY = "Backspace";
declare const DELETE_KEY = "Delete";
declare const HOME_KEY = "Home";
declare const END_KEY = "End";
declare const ARROW_UP_KEY = "ArrowUp";
declare const ARROW_DOWN_KEY = "ArrowDown";
declare const ARROW_LEFT_KEY = "ArrowLeft";
declare const ARROW_RIGHT_KEY = "ArrowRight";
/**
 * Properly escape IDs selectors to handle weird IDs
 */
declare const parseSelector: (selector: string) => string;
declare const toType: (object: unknown) => string;
/**
 * Public Util API
 */
declare const getUID: (prefix: string) => string;
declare const getTransitionDurationFromElement: (element: Element | null) => number;
declare const triggerTransitionEnd: (element: Element) => void;
declare const isElement: (object: unknown) => object is Element;
declare const getElement: (object: unknown) => HTMLElement | null;
declare const isVisible: (element: unknown) => boolean;
declare const isDisabled: (element: Element | null | undefined) => boolean;
declare const preventNavigationForAnchor: (event: Event, element: Element) => void;
declare const getClipboardText: (event: Event & Record<string, any>) => string;
declare const setAriaAttribute: (element: Element, name: string, value: boolean) => void;
declare const findShadowRoot: (element: Node) => ShadowRoot | null;
declare const noop: () => void;
/**
 * Trick to restart an element's animation
 *
 * @see https://www.harrytheo.com/blog/2021/02/restart-a-css-animation-with-javascript/#restarting-a-css-animation
 */
declare const reflow: (element: HTMLElement) => void;
declare const onDOMContentLoaded: (callback: () => void) => void;
declare const isRTL: () => boolean;
declare const execute: <T = any>(possibleCallback: T | ((...functionArgs: any[]) => T), args?: any[], defaultValue?: T | ((...functionArgs: any[]) => T)) => T;
declare const executeAfterTransition: (callback: () => void, transitionElement: Element, waitForTransition?: boolean) => void;
/**
 * Return the previous/next element of a list.
 *
 * @param list            The list of elements
 * @param activeElement   The active element
 * @param shouldGetNext   Choose to get next or previous element
 * @param isCycleAllowed
 * @return The proper element
 */
declare const getNextActiveElement: <T>(list: T[], activeElement: T, shouldGetNext: boolean, isCycleAllowed: boolean) => T;
/**
 * Resolve a Chassis custom property name under the prefix the stylesheet was
 * built with. The PostCSS preset (postcss/index.js) writes that prefix into
 * `--chassis-prefix` on `:root`, so a project that renames the namespace keeps
 * working without rebuilding the JS. With no marker (no prefixed stylesheet
 * loaded) the name comes back unprefixed, matching the raw Sass output. Not
 * cached: a stylesheet can load (or change) after the first read, and every
 * call site is already a style read or write.
 *
 * @param name  The unprefixed property name, e.g. `carousel-interval`
 * @return The full property name, e.g. `--cx-carousel-interval`
 */
declare const cssVar: (name: string) => string;
export { ARROW_DOWN_KEY, ARROW_LEFT_KEY, ARROW_RIGHT_KEY, ARROW_UP_KEY, BACKSPACE_KEY, DELETE_KEY, END_KEY, ENTER_KEY, ESCAPE_KEY, HOME_KEY, SPACE_KEY, TAB_KEY, cssVar, execute, executeAfterTransition, findShadowRoot, getClipboardText, getElement, getNextActiveElement, getTransitionDurationFromElement, getUID, isDisabled, isElement, isRTL, isVisible, noop, onDOMContentLoaded, parseSelector, preventNavigationForAnchor, reflow, setAriaAttribute, triggerTransitionEnd, toType };
//# sourceMappingURL=index.d.ts.map