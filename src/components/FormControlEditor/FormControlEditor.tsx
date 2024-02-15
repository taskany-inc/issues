import { editorLoader } from '@taskany/bricks';
import React from 'react';
import { FormControlEditor as FormEditor } from '@taskany/bricks/harmony';

import { tr } from './FormControlEditor.i18n';

editorLoader.config({
    paths: {
        vs: '/monaco',
    },
});

export const FormControlEditor = React.forwardRef<HTMLDivElement, React.ComponentProps<typeof FormEditor>>(
    ({ ...props }, ref) => (
        <FormEditor
            ref={ref}
            messages={{
                attachmentsButton: tr('Attach files'),
                attachmentsDescription: tr("drag'n'drop or pasting also supported"),
                attachmentsUploading: tr('Uploading...'),
            }}
            {...props}
        />
    ),
);
