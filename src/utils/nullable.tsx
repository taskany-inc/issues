import React from 'react';

// eslint-disable-next-line no-shadow
export function nullable<V>(v: V, render: (v: NonNullable<V>) => React.ReactNode) {
    return v ? render(v as NonNullable<V>) : null;
}
