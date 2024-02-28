import React, { ComponentProps } from 'react';
import { nullable } from '@taskany/bricks';
import { Text, Link } from '@taskany/bricks/harmony';

import { routes } from '../../hooks/router';
import { goalPageHeaderParent } from '../../utils/domObjects';

import s from './IssueParent.module.css';

interface Parent {
    id?: string;
    title: string;
}

interface IssueParentProps {
    parent: Array<Parent | undefined> | Parent;
    size?: ComponentProps<typeof Text>['size'];
}

export const IssueParent = ({ parent, size = 'l', ...props }: IssueParentProps) => {
    const normalizedParent = ([] as Array<Parent | undefined>).concat(parent).filter(Boolean) as Array<Parent>;

    return (
        <Text className={s.IssueParentTitle} size={size} weight="bold" as="span" {...props}>
            {normalizedParent.map((p, i) =>
                nullable(p.id, (id) => (
                    <span key={id} {...goalPageHeaderParent.attr}>
                        <Link href={routes.project(id)} view="secondary">
                            {p.title}
                        </Link>
                        {i < normalizedParent.length - 1 ? ', ' : ''}
                    </span>
                )),
            )}
        </Text>
    );
};
