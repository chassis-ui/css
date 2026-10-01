import { configSchema, z } from '@chassis-ui/docs/schema'

// The keys of `config.yml` that are the site's own. The version step (`pnpm changeset:version`)
// writes the version in `download` and `cdn`, and the SRI hashes.
export const siteConfigSchema = configSchema.extend({
  cdn: z.object({
    css: z.url(),
    cssHash: z.string(),
    js: z.url(),
    jsHash: z.string(),
    jsBundle: z.url(),
    jsBundleHash: z.string(),
    floatingUi: z.url(),
    vanillaCalendarPro: z.url()
  }),
  download: z.object({
    dist: z.url(),
    source: z.url()
  })
})

export type SiteConfig = z.infer<typeof siteConfigSchema>
