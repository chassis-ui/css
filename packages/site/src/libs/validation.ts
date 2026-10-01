import { z } from '@chassis-ui/docs/schema'

export const zHexColor = z.string().regex(/^#(?:[0-9a-fA-F]{3}){1,2}$/)

export const zNamedHexColors = (count: number) => {
  return z
    .object({
      name: z.union([z.string(), z.number()]),
      hex: zHexColor
    })
    .array()
    .length(count)
}

export const zPxSizeOrEmpty = z.string().regex(/^(?:\d+px)?$/)
