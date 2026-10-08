import { expect, test, type Page } from '@playwright/test'
import { openPage, TODAY } from './helpers/pages'

// The carousels of js/tests/visual/carousel.html in a real layout, with the bundle the page loads:
// the controls, the indicators and the arrow keys, scrolling of the track, focus, the ends of the
// track and autoplay, and the second carousel of the page, which fades. The options and the
// methods are tested in js/tests/unit/carousel.spec.js.

const ID = '#carousel-example-generic'

const INTERVAL = 5000
// Longer than the animation of a change of slide (300ms), shorter than the interval
const TRANSITION = 1000

const IMAGE = '<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360"/>'

const control = (page: Page, name: 'Next' | 'Previous') =>
  page.locator(ID).getByRole('button', { name, exact: true })
const indicator = (page: Page, number: number) =>
  page.locator(ID).getByRole('button', { name: `Slide ${number}`, exact: true })
const track = (page: Page) => page.locator(`${ID} .carousel-inner`)
// Without the copy of a slide that a transition over the ends adds for its duration
const slide = (page: Page, number: number) =>
  page.locator(`${ID} .carousel-item:not(.carousel-item-clone)`).nth(number - 1)

/** The slide is the one shown, the only active one, and the indicators say so */
async function expectSlide(page: Page, number: number) {
  await expect(slide(page, number)).toHaveClass(/\bactive\b/)
  await expect(slide(page, number)).toBeInViewport({ ratio: 0.99 })
  await expect.poll(() => offset(page, number)).toBeCloseTo(0, 0)
  await expect(page.locator(`${ID} .carousel-item`)).toHaveCount(3)
  await expect(page.locator(`${ID} .carousel-item.active`)).toHaveCount(1)
  await expect(indicator(page, number)).toHaveAttribute('aria-current', 'true')
  await expect(indicator(page, number)).toHaveClass(/\bactive\b/)
  await expect(page.locator(`${ID} .carousel-indicators [aria-current]`)).toHaveCount(1)
}

/** How far the slide is from its place in the track: negative when it left to the left */
async function offset(page: Page, number: number) {
  const [item, viewport] = await Promise.all([
    slide(page, number).boundingBox(),
    track(page).boundingBox()
  ])
  return item!.x - viewport!.x
}

/**
 * The page has one carousel, without options, and constructs no instance: the data API does at
 * the first use of a control. An instance with options is constructed as the docs say, with the
 * class of the bundle that the page loaded.
 */
async function construct(page: Page, config: Record<string, unknown> = {}, selector = ID) {
  await page.evaluate(
    async ({ selector, options }) => {
      const bundle = document.querySelector<HTMLScriptElement>('script[type="module"]')!.src
      const { Carousel } = await import(bundle)
      Carousel.getOrCreateInstance(selector, options)
    },
    { selector, options: config }
  )
}

/**
 * Stops the time of the page: timers and animation frames run only in `page.clock.runFor()`.
 * `openPage` fixed the date and left the timers running.
 */
async function stopTime(page: Page) {
  await page.clock.pauseAt(TODAY)
}

test.beforeEach(async ({ page }) => {
  // The images of the page are on another site
  await page.route(/imgur\.com/, (route) =>
    route.fulfill({ contentType: 'image/svg+xml', body: IMAGE })
  )
  await openPage(page, 'carousel')
  await expectSlide(page, 1)
})

test.describe('controls and indicators', () => {
  test('the next and previous controls change the slide, and the indicators follow', async ({
    page
  }) => {
    await control(page, 'Next').click()
    await expectSlide(page, 2)

    await control(page, 'Next').click()
    await expectSlide(page, 3)

    await control(page, 'Previous').click()
    await expectSlide(page, 2)
  })

  test('an indicator goes to its slide, over the slide in between', async ({ page }) => {
    await indicator(page, 3).click()
    await expectSlide(page, 3)

    await indicator(page, 1).click()
    await expectSlide(page, 1)
  })

  test('focus stays on the control or the indicator that was used', async ({ page }) => {
    await control(page, 'Next').focus()
    await page.keyboard.press('Enter')
    await expectSlide(page, 2)
    await expect(control(page, 'Next')).toBeFocused()

    await indicator(page, 3).focus()
    await page.keyboard.press('Space')
    await expectSlide(page, 3)
    await expect(indicator(page, 3)).toBeFocused()

    // Over the end, where the track is scrolled to a copy of the slide and back
    await control(page, 'Next').focus()
    await page.keyboard.press('Enter')
    await expectSlide(page, 1)
    await expect(control(page, 'Next')).toBeFocused()
  })
})

test.describe('keyboard and scrolling', () => {
  test('ArrowRight and ArrowLeft change the slide while focus is in the carousel', async ({
    page
  }) => {
    await construct(page)
    await indicator(page, 1).focus()

    await page.keyboard.press('ArrowRight')
    await expectSlide(page, 2)

    await page.keyboard.press('ArrowRight')
    await expectSlide(page, 3)

    await page.keyboard.press('ArrowLeft')
    await expectSlide(page, 2)
    await expect(indicator(page, 1)).toBeFocused()
  })

  test('the active slide and the indicator follow the track when it is scrolled', async ({
    page
  }) => {
    await construct(page)
    const { width } = (await track(page).boundingBox())!
    // What a swipe or a trackpad does. The position is set by script: Playwright has no swipe,
    // and a wheel event over a track with scroll snap is not reliable in WebKit.
    const scrollTo = (left: number) =>
      track(page).evaluate((el, left) => el.scrollTo({ left, behavior: 'instant' }), left)

    await scrollTo(width)
    await expectSlide(page, 2)

    await scrollTo(2 * width)
    await expectSlide(page, 3)

    await scrollTo(0)
    await expectSlide(page, 1)
  })
})

test.describe('ends of the track', () => {
  test('the next control continues forward from the last slide to the first', async ({ page }) => {
    await indicator(page, 3).click()
    await expectSlide(page, 3)
    await stopTime(page)

    await control(page, 'Next').click()
    // In the middle of the animation the last slide leaves to the left, as any slide does
    await page.clock.runFor(150)
    await expect.poll(() => offset(page, 3)).toBeLessThan(0)

    await page.clock.runFor(TRANSITION)
    await expectSlide(page, 1)
  })

  test('the previous control continues backward from the first slide to the last', async ({
    page
  }) => {
    await construct(page)
    await stopTime(page)

    await control(page, 'Previous').click()
    // In the middle of the animation the first slide leaves to the right
    await page.clock.runFor(150)
    await expect.poll(() => offset(page, 1)).toBeGreaterThan(0)

    await page.clock.runFor(TRANSITION)
    await expectSlide(page, 3)
  })

  test('with reduced motion the slide changes at once, and the ends wrap', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    // No frame of an animation runs
    await stopTime(page)

    await control(page, 'Next').click()
    await expectSlide(page, 2)

    await control(page, 'Previous').click()
    await expectSlide(page, 1)

    await control(page, 'Previous').click()
    await expectSlide(page, 3)

    await control(page, 'Next').click()
    await expectSlide(page, 1)
  })

  test('with `ends: stop` the control of an end is disabled, and focus goes to the other', async ({
    page
  }) => {
    await construct(page, { ends: 'stop' })
    await expect(control(page, 'Previous')).toBeDisabled()
    await expect(control(page, 'Next')).toBeEnabled()

    await control(page, 'Next').focus()
    await page.keyboard.press('Enter')
    await expectSlide(page, 2)
    await expect(control(page, 'Previous')).toBeEnabled()
    await expect(control(page, 'Next')).toBeEnabled()
    await expect(control(page, 'Next')).toBeFocused()

    await page.keyboard.press('Enter')
    await expectSlide(page, 3)
    await expect(control(page, 'Next')).toBeDisabled()
    await expect(control(page, 'Previous')).toBeFocused()

    await page.keyboard.press('Enter')
    await expectSlide(page, 2)
    await expect(control(page, 'Next')).toBeEnabled()
    await expect(control(page, 'Previous')).toBeFocused()
  })
})

test.describe('autoplay', () => {
  test.beforeEach(async ({ page }) => {
    await stopTime(page)
    await construct(page, { autoplay: true, interval: INTERVAL })
    await expect(page.locator(ID)).toHaveClass(/\bcarousel-playing\b/)
  })

  test('goes to the next slide after each interval, and from the last to the first', async ({
    page
  }) => {
    await page.clock.runFor(INTERVAL - 1)
    await expectSlide(page, 1)

    await page.clock.runFor(TRANSITION)
    await expectSlide(page, 2)

    await page.clock.runFor(INTERVAL)
    await expectSlide(page, 3)

    await page.clock.runFor(INTERVAL)
    await expectSlide(page, 1)
    await expect(page.locator(ID)).toHaveClass(/\bcarousel-playing\b/)
  })

  test('pauses while the pointer is over the carousel, and goes on when it leaves', async ({
    page
  }) => {
    await page.locator(ID).hover()
    await expect(page.locator(ID)).not.toHaveClass(/\bcarousel-playing\b/)

    await page.clock.runFor(3 * INTERVAL)
    await expectSlide(page, 1)

    await page.mouse.move(0, 0)
    await expect(page.locator(ID)).toHaveClass(/\bcarousel-playing\b/)

    await page.clock.runFor(INTERVAL + TRANSITION)
    await expectSlide(page, 2)
  })

  test('stops for good at the first use of a control', async ({ page }) => {
    await control(page, 'Next').click()
    await page.clock.runFor(TRANSITION)
    await expectSlide(page, 2)

    await page.mouse.move(0, 0)
    await expect(page.locator(ID)).not.toHaveClass(/\bcarousel-playing\b/)

    await page.clock.runFor(3 * INTERVAL)
    await expectSlide(page, 2)
  })
})

// `.carousel-fade`: the slides are stacked in one place, and the plugin sets the active one
// without scrolling. The fade itself is CSS: the slide that leaves stays visible while its
// opacity runs out, and is hidden when it has.
test.describe('fade', () => {
  const FADE = '#carousel-example-fade'

  const fadeControl = (page: Page, name: 'Next fade slide' | 'Previous fade slide') =>
    page.locator(FADE).getByRole('button', { name, exact: true })
  const fadeIndicator = (page: Page, number: number) =>
    page.locator(FADE).getByRole('button', { name: `Fade slide ${number}`, exact: true })
  const fadeSlide = (page: Page, number: number) =>
    page.locator(`${FADE} .carousel-item`).nth(number - 1)

  /** The slide is the only one shown, opaque, and the fade of the others is over */
  async function expectFadeSlide(page: Page, number: number) {
    await expect(fadeSlide(page, number)).toHaveClass(/\bactive\b/)
    await expect(page.locator(`${FADE} .carousel-item.active`)).toHaveCount(1)
    await expect(fadeSlide(page, number)).toHaveCSS('opacity', '1')
    await expect(fadeSlide(page, number)).toBeVisible()

    for (const other of [1, 2, 3].filter((slide) => slide !== number)) {
      await expect(fadeSlide(page, other)).toBeHidden()
      await expect(fadeSlide(page, other)).toHaveCSS('opacity', '0')
    }

    await expect(fadeIndicator(page, number)).toHaveAttribute('aria-current', 'true')
    await expect(page.locator(`${FADE} .carousel-indicators [aria-current]`)).toHaveCount(1)
    // The track has not moved
    expect(await page.locator(`${FADE} .carousel-inner`).evaluate((el) => el.scrollLeft)).toBe(0)
  }

  test('the slides are stacked in one place, and only the active one is shown', async ({
    page
  }) => {
    await expectFadeSlide(page, 1)

    const boxes = await Promise.all([1, 2, 3].map((number) => fadeSlide(page, number).boundingBox()))
    expect(boxes[1]).toEqual(boxes[0])
    expect(boxes[2]).toEqual(boxes[0])

    const track = page.locator(`${FADE} .carousel-inner`)
    expect(await track.evaluate((el) => el.scrollWidth - el.clientWidth)).toBe(0)
  })

  test('the next and previous controls fade to the slide, and the indicators follow', async ({
    page
  }) => {
    await fadeControl(page, 'Next fade slide').click()
    await expectFadeSlide(page, 2)

    await fadeControl(page, 'Next fade slide').click()
    await expectFadeSlide(page, 3)

    await fadeControl(page, 'Previous fade slide').click()
    await expectFadeSlide(page, 2)
  })

  test('the ends wrap: previous from the first slide is the last, next from it the first', async ({
    page
  }) => {
    await fadeControl(page, 'Previous fade slide').click()
    await expectFadeSlide(page, 3)

    await fadeControl(page, 'Next fade slide').click()
    await expectFadeSlide(page, 1)
  })

  test('an indicator goes to its slide', async ({ page }) => {
    await fadeIndicator(page, 3).click()
    await expectFadeSlide(page, 3)

    await fadeIndicator(page, 1).click()
    await expectFadeSlide(page, 1)
  })

  test('ArrowRight and ArrowLeft change the slide while focus is in the carousel', async ({
    page
  }) => {
    await construct(page, {}, FADE)
    await fadeIndicator(page, 1).focus()

    await page.keyboard.press('ArrowRight')
    await expectFadeSlide(page, 2)

    await page.keyboard.press('ArrowLeft')
    await expectFadeSlide(page, 1)
    await expect(fadeIndicator(page, 1)).toBeFocused()
  })

  test('the button of a slide that is not shown cannot be reached', async ({ page }) => {
    const buttons = page.locator(`${FADE} .carousel-inner`).getByRole('button')

    await expect(buttons).toHaveCount(1)
    await expect(buttons).toHaveText('Button one')

    await fadeControl(page, 'Next fade slide').click()
    await expectFadeSlide(page, 2)

    await expect(buttons).toHaveCount(1)
    await expect(buttons).toHaveText('Button two')

    // From the last indicator, Tab goes to the button of the slide shown and then to the
    // controls, over the buttons of the other slides
    await fadeIndicator(page, 3).focus()
    await page.keyboard.press('Tab')
    await expect(buttons).toBeFocused()
    await page.keyboard.press('Tab')
    await expect(fadeControl(page, 'Previous fade slide')).toBeFocused()
  })

  // Read in the task of the click, before a frame is drawn: the transitions that the change
  // of class has started. The slide that leaves is still visible, and is hidden by a
  // transition of `visibility` that waits for the one of `opacity`.
  test('the slide that leaves stays visible while it fades, the one that comes fades in', async ({
    page
  }) => {
    await construct(page, {}, FADE)

    const during = await page.evaluate((selector) => {
      const [leaving, coming] = document.querySelectorAll<HTMLElement>(`${selector} .carousel-item`)
      const properties = (item: HTMLElement) =>
        item
          .getAnimations()
          .map((animation) => (animation as CSSTransition).transitionProperty)
          .sort()

      document.querySelector<HTMLElement>(`${selector} [data-cx-slide="next"]`)!.click()

      return {
        leaving: { visibility: getComputedStyle(leaving).visibility, fades: properties(leaving) },
        coming: { visibility: getComputedStyle(coming).visibility, fades: properties(coming) }
      }
    }, FADE)

    expect(during).toEqual({
      leaving: { visibility: 'visible', fades: ['opacity', 'visibility'] },
      coming: { visibility: 'visible', fades: ['opacity'] }
    })
    await expectFadeSlide(page, 2)
  })

  test('with reduced motion the slide changes at once', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await construct(page, {}, FADE)

    const after = await page.evaluate((selector) => {
      const [leaving, coming] = document.querySelectorAll<HTMLElement>(`${selector} .carousel-item`)

      document.querySelector<HTMLElement>(`${selector} [data-cx-slide="next"]`)!.click()

      return {
        leaving: [getComputedStyle(leaving).visibility, leaving.getAnimations().length],
        coming: [getComputedStyle(coming).opacity, coming.getAnimations().length]
      }
    }, FADE)

    expect(after).toEqual({ leaving: ['hidden', 0], coming: ['1', 0] })
    await expectFadeSlide(page, 2)
  })
})
