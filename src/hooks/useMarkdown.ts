import remarkGFM from 'remark-gfm';
import remarkEmoji from 'remark-emoji';
import { useRemark, useRemarkSync } from 'react-remark';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ssrRenderOptions: any = {
    remarkPlugins: [remarkEmoji],
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
