import remarkEmoji from 'remark-emoji';
import { useRemarkSync, UseRemarkSyncOptions } from 'react-remark';
import { Link } from '@taskany/bricks/harmony';

import { ModalEvent, dispatchModalEvent } from '../utils/dispatchModal';

const mdAndPlainUrls =
    /((\[.*\])?(\(|<))?((https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|www\.[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9]+\.[^\s]{2,}|www\.[a-zA-Z0-9]+\.[^\s]{2,})(?:(\s?("|').*("|'))?))((\)|>)?)/gi;
const mdLiteralUrl = /((\[.*\])(\()(.*)((\)))|(<(.*)>))/i;
const toClearCharacters = '.,!]})>';

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
            a: (props: React.ComponentProps<typeof Link>) => <Link {...props} target="_blank" view="inline" />,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            img: (props: any) => (
                // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
                <img
                    {...props}
                    onClick={dispatchModalEvent(ModalEvent.ImageFullScreen, { src: props.src, alt: props.alt })}
                    style={{ cursor: 'pointer' }}
                />
            ),
            p: ({ children }: React.PropsWithChildren) => {
                if (Array.isArray(children)) {
                    return (
                        <>
                            {children.map((c) => {
                                if (typeof c === 'string') {
                                    return (
                                        <p
                                            key={c}
                                            // React drops the `\n\r` symbols, escapes the html tags
                                            dangerouslySetInnerHTML={{
                                                __html: c.replaceAll('\n', '<br />'),
                                            }}
                                        />
                                    );
                                }

                                return <p key={c}>{c}</p>;
                            })}
                        </>
                    );
                }

                return <p>{children}</p>;
            },
        },
    },
};

export const useMarkdown = (string: string) => {
    return useRemarkSync(string, ssrRenderOptions);
};
