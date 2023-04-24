import { FC } from 'react';
import { FormEditor as FormEditorBricks } from '@taskany/bricks';

import { tr } from './FormEditor.i18n';

export const FormEditor: FC<React.ComponentProps<typeof FormEditorBricks>> = ({ ...props }) => (
    <FormEditorBricks
        messages={{
            attachments: tr('Attach files by dragging & dropping, selecting or pasting them.'),
            attachmentsUploading: tr('Uploading...'),
        }}
        {...props}
    />
);
