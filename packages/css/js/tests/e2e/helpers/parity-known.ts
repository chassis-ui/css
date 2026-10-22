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

export const KNOWN_PAIR_DIFFERENCES: KnownPairDifference[] = []
