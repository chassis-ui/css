import { capitalizeFirstLetter } from '@chassis-ui/docs'
import { z, zLanguageCode, zVersionMajorMinor, zVersionSemver } from '@chassis-ui/docs/schema'
import { createDataLoader } from '@chassis-ui/docs/site'
import { zHexColor, zNamedHexColors, zPxSizeOrEmpty } from './validation'

// An object containing all the data types and their associated schema. The key should match the name of the data file
// in the `data/` directory of the site. `sidebar.yml` is read by `@chassis-ui/docs`.
const dataDefinitions = {
  breakpoints: z
    .object({
      breakpoint: z.string(),
      abbr: z.string(),
      name: z.string(),
      'min-width': zPxSizeOrEmpty,
      container: zPxSizeOrEmpty
    })
    .array(),
  'basic-opacities': z
    .object({
      name: z.string()
    })
    .array(),
  colors: zNamedHexColors(7),
  'color-values': z
    .object({
      name: z.string()
    })
    .array(),
  'context-colors': z
    .object({
      name: z.string(),
      hex: zHexColor,
      contrast_color: z.union([z.literal('black'), z.literal('white')]).optional()
    })
    .array()
    .transform((val) => {
      // Add a `title` property to each theme color object being the capitalized version of the `name` property.
      return val.map((contextColor) => ({
        ...contextColor,
        title: capitalizeFirstLetter(contextColor.name)
      }))
    }),
  'core-team': z
    .object({
      name: z.string(),
      user: z.string()
    })
    .array(),
  'docs-versions': z
    .object({
      group: z.string(),
      baseurl: z.url(),
      description: z.string(),
      versions: z.union([zVersionSemver, zVersionMajorMinor]).array()
    })
    .array(),
  grays: zNamedHexColors(11),
  icons: z.object({
    preferred: z
      .object({
        name: z.string(),
        website: z.url()
      })
      .array(),
    more: z
      .object({
        name: z.string(),
        website: z.url()
      })
      .array()
  }),
  plugins: z
    .object({
      description: z.string(),
      link: z.string().startsWith('components/'),
      name: z.string()
    })
    .array(),
  'token-opacities': z
    .object({
      name: z.string()
    })
    .array(),
  sizes: z.string().array(),
  translations: z
    .object({
      name: z.string(),
      code: zLanguageCode,
      description: z.string(),
      url: z.url()
    })
    .array()
}

// A helper to get data loaded from a yml file in the `data/` directory of the site. If the data
// does not match its schema in `dataDefinitions`, the build fails with the keys that are invalid.
export const getData = createDataLoader(dataDefinitions)
