import { forwardRef, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import styled from 'styled-components';
import { ComboBox, GoalIcon, nullable } from '@taskany/bricks';
import { Estimate, State as StateType } from '@prisma/client';

import { trpc } from '../utils/trpcClient';
import { ActivityByIdReturnType } from '../../trpc/inferredTypes';
import { estimateToString } from '../utils/estimateToString';

import { TableRow, ContentItem, TitleItem, TitleContainer, Title, TextItem, Table } from './Table';
import { StateDot } from './StateDot';
import { UserGroup } from './UserGroup';

const StyledTable = styled(Table)`
    display: grid;
    grid-template-columns: 35px minmax(250px, 20%) repeat(4, max-content);
    padding: 0;
    margin: 0;
`;

interface GoalSuggestProps {
    onChange: (val: any) => void;
    value?: string;
    renderInput: React.ComponentProps<typeof ComboBox>['renderInput'];
}

interface GoalSuggestItemProps {
    projectId: string | null;
    title: string;
    owner?: ActivityByIdReturnType;
    issuer?: ActivityByIdReturnType;
    state?: StateType;
    estimate?: Estimate;
    focused: boolean;
    onClick?: () => void;
}

const GoalSuggestItem: React.FC<GoalSuggestItemProps> = ({
    title,
    projectId,
    owner,
    issuer,
    state,
    estimate,
    focused,
    onClick,
}) => {
    const rowRef = useRef<HTMLDivElement>(null);
    const issuers = useMemo(() => {
        if (issuer && owner && owner.id === issuer.id) {
            return [owner];
        }

        return [issuer, owner].filter(Boolean) as NonNullable<ActivityByIdReturnType>[];
    }, [issuer, owner]);

    return (
        <TableRow onClick={onClick} focused={focused} tabIndex={-1} ref={rowRef}>
            <ContentItem>
                <GoalIcon size="s" />
            </ContentItem>
            <TitleItem>
                <TitleContainer>
                    <Title>{title}</Title>
                </TitleContainer>
            </TitleItem>
            <ContentItem>
                {nullable(state, (s) => (
                    <StateDot size="m" title={s?.title} hue={s?.hue} />
                ))}
            </ContentItem>
            <ContentItem>
                <TextItem>{projectId}</TextItem>
            </ContentItem>
            <ContentItem>
                <UserGroup users={issuers} />
            </ContentItem>
            <ContentItem>
                <TextItem>{nullable(estimate, (e) => estimateToString(e))}</TextItem>
            </ContentItem>
        </TableRow>
    );
};

export const GoalSuggest = forwardRef<HTMLDivElement, GoalSuggestProps>(
    ({ onChange, value = '', renderInput }, ref) => {
        const [visible, setVisible] = useState(false);

        const { data: items = [] } = trpc.goal.suggestions.useQuery(
            { input: value, limit: 5 },
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
                value={value}
                onChange={onSelectItem}
                items={items}
                visible={visible}
                renderInput={renderInput}
                maxWidth={400}
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
                        estimate={item._lastEstimate}
                    />
                )}
                renderItems={(children) => <StyledTable columns={6}>{children as React.ReactNode}</StyledTable>}
            />
        );
    },
);
