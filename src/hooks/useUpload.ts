import { useState } from 'react';

import { formFieldName } from '../utils/upload';

export const useUpload = () => {
    const [loading, setLoading] = useState(false);
    const [files, setFiles] = useState<string[]>();

    const uploadFiles = async (files: FileList) => {
        setLoading(true);

        const body = new FormData();
        Array.from(files).forEach((f) => body.append(formFieldName, f));

        const response = await fetch('/api/upload', {
            method: 'POST',
            body,
        });

        setLoading(false);

        const res = await response.json();
        setFiles(res);
    };

    return {
        files,
        loading,
        uploadFiles,
    };
};
