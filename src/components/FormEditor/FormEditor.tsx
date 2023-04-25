import { FormEditor as FormEditorBricks } from '@taskany/bricks';
import React from 'react';

import { tr } from './FormEditor.i18n';

export const FormEditor = React.forwardRef<HTMLDivElement, React.ComponentProps<typeof FormEditorBricks>>(
    ({ ...props }, ref) => (
        <FormEditorBricks
            ref={ref}
            messages={{
                attachments: tr('Attach files by dragging & dropping, selecting or pasting them.'),
                attachmentsUploading: tr('Uploading...'),
            }}
            {...props}
        />
    ),
);
