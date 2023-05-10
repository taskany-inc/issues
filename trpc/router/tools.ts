/* eslint-disable newline-per-chained-call */
import { z } from 'zod';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkHtml from 'remark-html';
import remarkGFM from 'remark-gfm';
import remarkEmoji from 'remark-emoji';

import { protectedProcedure, router } from '../trpcBackend';

export const tools = router({
    md: protectedProcedure.input(z.string()).query(async ({ input }) => {
        return (
            await unified().use(remarkParse).use(remarkGFM).use(remarkEmoji).use(remarkHtml).process(input)
        ).toString();
    }),
});
