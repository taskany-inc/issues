import remarkGFM from 'remark-gfm';
import remarkEmoji from 'remark-emoji';
import { useRemark, useRemarkSync } from 'react-remark';

import { ModalEvent, dispatchModalEvent } from '../utils/dispatchModal';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ssrRenderOptions: any = {
    remarkPlugins: [remarkEmoji],
    rehypeReactOptions: {
        components: {
            img: (props: any) => (
                // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
                <img
                    {...props}
                    onClick={dispatchModalEvent(ModalEvent.ImageFullScreen, { src: props.src, alt: props.alt })}
                    style={{ cursor: 'pointer' }}
                ></img>
            ),
        },
    },
};
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const clientRenderOptions: any = {
    remarkPlugins: [remarkGFM, remarkEmoji],
};

export const useMarkdown = (string: string) => {
    const ssrContent = useRemarkSync(string, ssrRenderOptions);
    const [clientContent] = useRemark(clientRenderOptions);

    return clientContent ?? ssrContent;
};
