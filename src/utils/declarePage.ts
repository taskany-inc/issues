import { NextPageWithAuth } from '../types/nextPageWithAuth';

import { ExternalPageProps } from './declareSsrProps';

export function declarePage<D = unknown, P = ExternalPageProps['params']>(
    Сomponent: (props: ExternalPageProps<D, P>) => JSX.Element,
    options?: { private: boolean },
) {
    if (options?.private) {
        (Сomponent as NextPageWithAuth).auth = true;
    }

    return Сomponent;
}
