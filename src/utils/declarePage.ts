import { NextPageWithAuth } from '../types/nextPageWithAuth';

import { ExternalPageProps } from './declareSsrProps';

<<<<<<< HEAD
export const declarePage = (Сomponent: (props: ExternalPageProps) => JSX.Element, options: { private: boolean }) => {
    if (options.private) {
=======
export function declarePage<D = unknown, P = ExternalPageProps['params']>(
    Сomponent: (props: ExternalPageProps<D, P>) => JSX.Element,
    options?: { private: boolean },
) {
    if (options?.private) {
>>>>>>> aef0f53 (helper)
        (Сomponent as NextPageWithAuth).auth = true;
    }

    return Сomponent;
}
