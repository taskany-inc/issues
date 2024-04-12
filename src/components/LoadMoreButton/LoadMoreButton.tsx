import { Button } from '@taskany/bricks/harmony';

import { tr } from './LoadMoreButton.i18n';
import s from './LoadMoreButton.module.css';

export const LoadMoreButton = (props: React.ComponentProps<typeof Button>) => (
    <div className={s.LoadMoreButtonWrapper}>
        <Button {...props} text={tr('Load more...')} />
    </div>
);
