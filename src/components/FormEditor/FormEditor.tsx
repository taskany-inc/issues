import { FormEditor as FormEditorBricks } from '@taskany/bricks';
import React from 'react';

import { tr } from './FormEditor.i18n';

export const FormEditor = React.forwardRef<HTMLDivElement, React.ComponentProps<typeof FormEditorBricks>>(
    ({ ...props }, ref) => (
        <FormEditorBricks
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
