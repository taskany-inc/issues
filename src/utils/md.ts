/* eslint-disable @typescript-eslint/no-var-requires */
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import remarkGFM from 'remark-gfm';
import remarkEmoji from 'remark-emoji';
import rehypeKatex from 'rehype-katex';
import remarkMath from 'remark-math';
import rehypeStringify from 'rehype-stringify';
import rehypeSlug from 'rehype-slug';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';
import remarkHint from 'remark-hint';

const remarkHeadingId = require('remark-heading-id');
const rehypePrism = require('@mapbox/rehype-prism');

// TODO: my be customized
const headingAnchorElement = {
    content: {
        type: 'element',
        tagName: 'svg',
        properties: { viewBox: '0 0 16 16', width: 16, height: 16, classname: 'anchor' },
        children: [
            {
                type: 'element',
                tagName: 'path',
                properties: {
                    d: 'M7.775 3.275a.75.75 0 001.06 1.06l1.25-1.25a2 2 0 112.83 2.83l-2.5 2.5a2 2 0 01-2.83 0 .75.75 0 00-1.06 1.06 3.5 3.5 0 004.95 0l2.5-2.5a3.5 3.5 0 00-4.95-4.95l-1.25 1.25zm-4.69 9.64a2 2 0 010-2.83l2.5-2.5a2 2 0 012.83 0 .75.75 0 001.06-1.06 3.5 3.5 0 00-4.95 0l-2.5 2.5a3.5 3.5 0 004.95 4.95l1.25-1.25a.75.75 0 00-1.06-1.06l-1.25 1.25a2 2 0 01-2.83 0z',
                },
            },
        ],
    },
};

export const md = (s: string) =>
    unified()
        .data('settings', { fragment: true })
        .use(remarkParse)
        .use(remarkMath)
        .use(remarkHeadingId)
        .use(remarkEmoji, { emoticon: true })
        .use(remarkGFM)
        .use(remarkHint)
        .use(remarkRehype, { allowDangerousHtml: true })
        .use(rehypePrism)
        .use(rehypeSlug)
        // @ts-ignore
        .use(rehypeAutolinkHeadings, headingAnchorElement)
        .use(rehypeKatex)
        .use(rehypeStringify, { allowDangerousHtml: true })
        .processSync(s)
        .value.toString();
