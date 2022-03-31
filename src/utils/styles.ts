import { FlattenSimpleInterpolation } from 'styled-components';

export const compare = (expected: any, actual: any) =>
    Object.keys(expected).every((key) => {
        const ao = actual[key];
        const eo = expected[key];

        return ao === eo;
    });

export const is = (predicate: Record<string, unknown>, styles: FlattenSimpleInterpolation) => (
    props: Record<string, unknown>,
) => (compare(predicate, props) ? styles : null);
