import {
    AnchorHTMLAttributes,
    BlockquoteHTMLAttributes,
    HTMLAttributes,
    ImgHTMLAttributes,
    LiHTMLAttributes,
    OlHTMLAttributes,
} from 'react';
import NextLink from 'next/link';
import remarkEmoji from 'remark-emoji';
import { useRemarkSync, UseRemarkSyncOptions } from 'react-remark';
import { Image, Link, Text } from '@taskany/bricks/harmony';

import { ModalEvent, dispatchModalEvent } from '../utils/dispatchModal';
import { parseCrewLink } from '../utils/crew';
import { InlineUserBadge } from '../components/InlineUserBadge/InlineUserBadge';

const mdAndPlainUrls =
    /((\[.*\])?(\(|<))?((https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|www\.[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9]+\.[^\s]{2,}|www\.[a-zA-Z0-9]+\.[^\s]{2,})(?:(\s?("|').*("|'))?))((\)|>)?)/gi;
const mdLiteralUrl = /((\[.*\])(\()(.*)((\)))|(<(.*)>))/i;
const toClearCharacters = '.,!]})>';

export const markdownComponents = {
    a: (props: AnchorHTMLAttributes<HTMLAnchorElement>) => <Link {...props} target="_blank" view="inline" />,
    img: (props: ImgHTMLAttributes<HTMLImageElement>) => <Image {...props} />,
    ul: (props: HTMLAttributes<HTMLUListElement>) => <Text as="ul" {...props} />,
    ol: (props: OlHTMLAttributes<HTMLOListElement>) => <Text as="ol" {...props} />,
    li: (props: LiHTMLAttributes<HTMLLIElement>) => <Text as="li" {...props} />,
    h1: (props: HTMLAttributes<HTMLDivElement>) => <Text as="h1" {...props} />,
    h2: (props: HTMLAttributes<HTMLDivElement>) => <Text as="h2" {...props} />,
    h3: (props: HTMLAttributes<HTMLDivElement>) => <Text as="h3" {...props} />,
    h4: (props: HTMLAttributes<HTMLDivElement>) => <Text as="h4" {...props} />,
    h5: (props: HTMLAttributes<HTMLDivElement>) => <Text as="h5" {...props} />,
    h6: (props: HTMLAttributes<HTMLDivElement>) => <Text as="h6" {...props} />,
    p: (props: HTMLAttributes<HTMLDivElement>) => <Text as="p" {...props} />,
    strong: (props: HTMLAttributes<HTMLDivElement>) => <Text as="strong" weight="bold" {...props} />,
    blockquote: (props: BlockquoteHTMLAttributes<HTMLQuoteElement>) => <Text as="blockquote" {...props} />,
};

const cleanUrl = (url: string): string => {
    const trimURL = url.trim();

    let toDropFromEnd = url.length;

    while (toClearCharacters.includes(trimURL[toDropFromEnd - 1])) {
        toDropFromEnd -= 1;
    }

    return trimURL.slice(0, toDropFromEnd);
};

const ssrRenderOptions: UseRemarkSyncOptions = {
    remarkPlugins: [
        // @ts-ignore 'cause different types between plugin and `UseRemarkSyncOptions['remarkPlugins']`
        remarkEmoji,
        function plugin() {
            return (_, vFile) => {
                const VFileCtor = vFile.constructor;
                let changed = vFile.contents.slice().toString();

                // match all urls in content
                const matched = changed.matchAll(mdAndPlainUrls);
                const matchedArray: RegExpMatchArray[] = [];
                let current = matched.next();

                while (!current.done) {
                    matchedArray.push(current.value);
                    current = matched.next();
                }

                for (let i = matchedArray.length - 1; i >= 0; i -= 1) {
                    const match = matchedArray[i];
                    const [matchedString] = match;
                    const { index = 0 } = match;

                    if (!mdLiteralUrl.test(matchedString)) {
                        const cleanedUrl = cleanUrl(matchedString);
                        const mdLinkLiteral = `<${cleanedUrl}>`;
                        changed = `${changed.slice(0, index)}${mdLinkLiteral}${changed.slice(
                            index + cleanedUrl.length,
                            changed.length,
                        )}`;
                    }
                }

                // @ts-ignore 'cause `VFileCtor` type is `Function`
                return this.parse(new VFileCtor(changed));
            };
        },
    ],

    rehypeReactOptions: {
        components: {
            ...markdownComponents,
            a: ({ href, title, ...props }: AnchorHTMLAttributes<HTMLAnchorElement>) => {
                const login = href ? parseCrewLink(href) : '';

                if (href && login) {
                    return (
                        <NextLink href={href} passHref target="_blank">
                            <InlineUserBadge tooltip={title} name={login} email={login} size="xs" />
                        </NextLink>
                    );
                }
                return <Link {...props} title={title} href={href} target="_blank" view="inline" />;
            },
            img: (props: React.ComponentProps<typeof Image>) => (
                <Image
                    {...props}
                    onClick={dispatchModalEvent(ModalEvent.ImageFullScreen, { src: props.src ?? '', alt: props.alt })}
                />
            ),
            p: ({ children }: React.PropsWithChildren) => {
                const childrenArray = !Array.isArray(children) ? [children] : children;

                return (
                    <Text as="p">
                        {childrenArray.map((c) => {
                            if (typeof c === 'string') {
                                return c
                                    .split('\n')
                                    .flatMap((n, i) => [n, <br key={i} />])
                                    .slice(0, -1);
                            }

                            return c;
                        })}
                    </Text>
                );
            },
        },
    },
};

export const useMarkdown = (string: string) => {
    return useRemarkSync(string, ssrRenderOptions);
};
