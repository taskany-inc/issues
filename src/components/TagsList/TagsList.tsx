import { PropsWithChildren } from 'react';

import s from './TagsList.module.css';

export const TagsList = ({ children, ...props }: PropsWithChildren) => {
    return (
        <div className={s.TagsList} {...props}>
            {children}
        </div>
    );
};
