import { Badge, Spinner } from '@taskany/bricks/harmony';

import { tr } from './Loader.i18n';

export const Loader = () => <Badge iconLeft={<Spinner size="s" />} text={tr('Loading ...')} />;
