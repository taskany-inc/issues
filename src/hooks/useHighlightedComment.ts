import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

import { commentMask } from '../components/CommentView';

export const useHighlightedComment = () => {
    const { asPath } = useRouter();
    const [highlightCommentId, setHighlightCommentId] = useState<string | undefined>(undefined);

    useEffect(() => {
        let tId: NodeJS.Timeout;
        if (highlightCommentId) {
            tId = setTimeout(() => setHighlightCommentId(undefined), 1000);
        }

        return () => clearInterval(tId);
    }, [highlightCommentId]);

    useEffect(() => {
        const targetComment = asPath.split(`#${commentMask}`)[1];

        if (targetComment) {
            setHighlightCommentId(targetComment);
        }
    }, [asPath]);

    return { highlightCommentId, setHighlightCommentId };
};
