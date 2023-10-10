import { useCallback, useEffect, useState } from 'react';
import * as Sentry from '@sentry/nextjs';

type CopiedValue = string | null;
type CopyFn = (text: string) => Promise<boolean>;

export const useCopyToClipboard = (ms = 500): [CopiedValue, CopyFn, boolean] => {
    const [copiedText, setCopiedText] = useState<CopiedValue>(null);
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        let timer: NodeJS.Timer;
        if (success) {
            timer = setTimeout(() => {
                setSuccess(false);
            }, ms);
        }

        return () => {
            window.clearTimeout(timer);
        };
    }, [success, ms]);

    const copy = useCallback(async (text: string) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopiedText(text);
            setSuccess(true);
            return true;
        } catch (error) {
            setCopiedText(null);
            setSuccess(false);

            const copyFailedError = new Error('Copy failed');
            Sentry.captureException(copyFailedError);
            return Promise.reject(copyFailedError);
        }
    }, []);

    return [copiedText, copy, success];
};
