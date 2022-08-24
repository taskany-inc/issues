import React, { useState } from 'react';

import { formFieldName } from '../utils/upload';

export const useUpload = () => {
    const [loading, setLoading] = useState(false);
    const [files, setFiles] = useState<string[]>();

    const onFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files) return;

        setLoading(true);

        const body = new FormData();
        Array.from(e.target.files).forEach((f) => body.append(formFieldName, f));

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
        onFileInputChange,
    };
};
