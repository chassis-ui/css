import { z } from 'zod'
import { defineCollection } from 'astro:content'
import { glob } from 'astro/loaders'

const docsSchema = z.object({
  added: z
    .object({
      show_badge: z.boolean().optional(),
      version: z.string()
    })
    .optional(),
  aliases: z.string().or(z.string().array()).optional(),
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
  description: z.string(),
  extra_js: z
    .object({
      async: z.boolean().optional(),
      src: z.string()
    })
    .array()
    .optional(),
  js: z.enum(['required', 'optional']).optional(),
  mdn: z.string().optional(),
  sections: z
    .object({
      description: z.string(),
      title: z.string()
    })
    .array()
    .optional(),
  thumbnail: z.string().optional(),
  title: z.string(),
  toc: z.boolean().optional(),
  tokens: z
    .union([z.enum(['component', 'context']), z.object({ scopes: z.string().array().optional() })])
    .optional()
})

const docsCollection = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './content/docs' }),
  schema: docsSchema
})

const calloutsSchema = z.object({})

const calloutsCollection = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './content/callouts' }),
  schema: calloutsSchema
})

export const collections = {
  docs: docsCollection,
  callouts: calloutsCollection
}
