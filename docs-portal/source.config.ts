import { defineConfig, defineDocs } from 'fumadocs-mdx/config';
import { metaSchema, pageSchema } from 'fumadocs-core/source/schema';
import { z } from 'zod';

const governedPageSchema = pageSchema.extend({
  owner: z.string().optional(),
  last_reviewed: z.string().optional(),
  status: z.enum(['active', 'draft', 'deprecated', 'superseded']).optional(),
  domain: z.string().optional(),
});

export const docs = defineDocs({
  dir: 'content/docs',
  docs: {
    schema: governedPageSchema,
    postprocess: {
      includeProcessedMarkdown: true,
    },
  },
  meta: {
    schema: metaSchema,
  },
});

export default defineConfig({});
