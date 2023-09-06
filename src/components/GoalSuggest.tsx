import { forwardRef, useCallback, useEffect, useState } from 'react';
import styled from 'styled-components';
import { ComboBox, Table } from '@taskany/bricks';
import { radiusM, gapS, gapXs } from '@taskany/colors';
import { DateType, State as StateType } from '@prisma/client';

import { trpc } from '../utils/trpcClient';
import { ActivityByIdReturnType } from '../../trpc/inferredTypes';

import { GoalListItemCompact } from './GoalListItemCompact';

interface GoalSuggestProps {
    onChange: (val: any) => void;
    value?: string;
    showSuggest?: boolean;
    renderInput: React.ComponentProps<typeof ComboBox>['renderInput'];
    className?: string;
}

const StyledGoalListItemCompact = styled(GoalListItemCompact)`
    border-radius: ${radiusM};
    padding: ${gapXs} ${gapS};
`;

interface GoalSuggestItemProps {
    projectId: string | null;
    title: string;
    owner?: ActivityByIdReturnType;
    issuer?: ActivityByIdReturnType;
    state?: StateType;
    estimate?: Date;
    estimateType?: DateType;
    focused: boolean;
    onClick?: () => void;
}

const GoalSuggestItem: React.FC<GoalSuggestItemProps> = ({ focused, onClick, ...props }) => {
    return (
        <StyledGoalListItemCompact
            icon
            onClick={onClick}
            focused={focused}
            align="center"
            gap={10}
            item={props}
            columns={[
                { name: 'title', columnProps: { col: 4 } },
                { name: 'state', columnProps: { col: 1, justify: 'end' } },
                { name: 'projectId', columnProps: { col: 3 } },
                { name: 'issuers', columnProps: { col: 1 } },
                { name: 'estimate', columnProps: { width: '8ch' } },
            ]}
        />
    );
};

export const GoalSuggest = forwardRef<HTMLDivElement, GoalSuggestProps>(
    ({ onChange, value, renderInput, showSuggest, className }, ref) => {
        const [visible, setVisible] = useState(showSuggest);

        const { data: items = [] } = trpc.goal.suggestions.useQuery(
            { input: value || '', limit: 5 },
            {
                staleTime: 0,
                cacheTime: 0,
            },
        );

        useEffect(() => {
            if (items.length > 0) {
                setVisible(true);
            } else {
                setVisible(false);
            }
        }, [items]);

        const onSelectItem = useCallback<typeof onChange>(
            (val) => {
                if (val) {
                    onChange(val);
                }
            },
            [onChange],
        );

        return (
            <ComboBox
                ref={ref}
                className={className}
                value={value}
                onChange={onSelectItem}
                items={items}
                visible={visible && showSuggest}
                renderInput={renderInput}
                maxWidth={550}
                renderItem={({ item, cursor, index, onClick }) => (
                    <GoalSuggestItem
                        key={item.id}
                        focused={cursor === index}
                        onClick={onClick}
                        projectId={item.projectId}
                        title={item.title}
                        state={item.state}
                        issuer={item.activity}
                        owner={item.owner}
                        estimate={item.estimate}
                        estimateType={item.estimateType}
                    />
                )}
                renderItems={(children) => <Table width={550}>{children as React.ReactNode}</Table>}
            />
        );
    },
);
