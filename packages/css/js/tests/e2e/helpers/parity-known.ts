// The utility pairs of js/tests/e2e/tailwind-parity.spec.ts that compute differently in
// dist/css/chassis.css and in the Tailwind build today, recorded so that the check passes and a
// new difference fails it. Nothing here is accepted: each entry is a defect, and the entry goes
// with its fix. The test also fails on an entry that no longer differs, so the list cannot hold
// more than is there.

export interface KnownPairDifference {
  /** The two classes on one element, as the test names them: `mb-0 -m-2xl` */
  classes: string
  /** A physical longhand, or `> name` for the second child of the element */
  property: string
  reason: string
}

const PLACE =
  '`place-*` comes after `align-*` and `justify-*` in scss/utilities/_flex.scss, so natively the shorthand wins; Tailwind sorts the longhand last and it wins, as `mt-*` wins over `m-*` in both builds'

const NEGATIVE =
  'The negative margins come after every positive one in scss/utilities/_margin.scss, so natively a negative shorthand wins over a positive longhand; Tailwind sorts the longhand last and it wins'

export const KNOWN_PAIR_DIFFERENCES: KnownPairDifference[] = [
  { classes: 'align-content-around place-content-between', property: 'align-content', reason: PLACE },
  { classes: 'align-items-baseline place-items-center', property: 'align-items', reason: PLACE },
  { classes: 'align-self-auto place-self-center', property: 'align-self', reason: PLACE },
  { classes: 'justify-content-around place-content-between', property: 'justify-content', reason: PLACE },
  { classes: 'mb-0 -m-2xl', property: 'margin-bottom', reason: NEGATIVE },
  { classes: 'mb-0 -my-2xl', property: 'margin-bottom', reason: NEGATIVE },
  { classes: 'me-0 -m-2xl', property: 'margin-right', reason: NEGATIVE },
  { classes: 'me-0 -mx-2xl', property: 'margin-right', reason: NEGATIVE },
  { classes: 'ms-0 -m-2xl', property: 'margin-left', reason: NEGATIVE },
  { classes: 'ms-0 -mx-2xl', property: 'margin-left', reason: NEGATIVE },
  { classes: 'mt-0 -m-2xl', property: 'margin-top', reason: NEGATIVE },
  { classes: 'mt-0 -my-2xl', property: 'margin-top', reason: NEGATIVE },
  { classes: 'mx-0 -m-2xl', property: 'margin-left', reason: NEGATIVE },
  { classes: 'mx-0 -m-2xl', property: 'margin-right', reason: NEGATIVE },
  { classes: 'my-0 -m-2xl', property: 'margin-top', reason: NEGATIVE },
  { classes: 'my-0 -m-2xl', property: 'margin-bottom', reason: NEGATIVE },
]
