import { defineCollection } from 'astro:content'
import { glob } from 'astro/loaders'
import { calloutsSchema, docsSchema, z } from '@chassis-ui/docs/schema'

// The frontmatter that `@chassis-ui/docs` reads, and the keys of `PageMeta.astro`
const siteDocsSchema = docsSchema.extend({
  css_layer: z
    .enum(['reboot', 'layout', 'content', 'components', 'helpers', 'utilities'])
    .optional(),
  css_media: z.enum(['container', 'viewport']).optional(),
  deps: z
    .object({
      title: z.string(),
      url: z.string().optional()
    })
    .array()
    .optional(),
  js: z.enum(['required', 'optional']).optional(),
  mdn: z.string().optional(),
  tokens: z
    .union([z.enum(['component', 'context']), z.object({ scopes: z.string().array().optional() })])
    .optional()
})

const docsCollection = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './content/docs' }),
  schema: siteDocsSchema
})

const calloutsCollection = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './content/callouts' }),
  schema: calloutsSchema
})

export const collections = {
  docs: docsCollection,
  callouts: calloutsCollection
}
