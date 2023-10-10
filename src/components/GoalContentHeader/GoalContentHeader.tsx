import { Card, CardComment, CardInfo, Dropdown, MenuItem, Text, nullable } from '@taskany/bricks';
import { ComponentProps, FC, useCallback, useMemo } from 'react';
import { gray7 } from '@taskany/colors';
import dynamic from 'next/dynamic';
import { IconClipboardOutline, IconMoreVerticalOutline } from '@taskany/icons';
import styled from 'styled-components';

import { CardHeader } from '../CardHeader';
import { RelativeTime } from '../RelativeTime/RelativeTime';
import { useClickSwitch } from '../../hooks/useClickSwitch';
import { useCopyToClipboard } from '../../hooks/useCopyToClipboard';
import { notifyPromise } from '../../utils/notifyPromise';

import { tr } from './GoalContentHeader.i18n';

const Md = dynamic(() => import('../Md'));

const StyledCardInfo = styled(CardInfo)`
    display: flex;
    justify-content: space-between;
    align-items: center;
`;

const StyledMenuItem = styled(MenuItem)`
    display: flex;
    justify-content: start;
`;

const StyledIconClipboardOutline = styled(IconClipboardOutline)`
    display: flex;
`;

interface GoalContentHeaderProps extends Pick<ComponentProps<typeof RelativeTime>, 'date' | 'kind'> {
    name?: string | null;
    description?: string;
}

export const GoalContentHeader: FC<GoalContentHeaderProps> = ({ name, description, date, kind }) => {
    const [isRelative, onDateViewTypeChange] = useClickSwitch();
    const [, copyValue] = useCopyToClipboard();

    const onCopyDescription = useCallback(() => {
        if (!description) return;

        notifyPromise(copyValue(description), 'copy');
    }, [copyValue, description]);

    const dropdownItems = useMemo(
        () =>
            navigator?.clipboard
                ? [
                      {
                          label: tr('Copy raw'),
                          icon: <StyledIconClipboardOutline size="xxs" />,
                          onClick: onCopyDescription,
                      },
                  ]
                : [],
        [onCopyDescription],
    );

    return (
        <Card>
            <StyledCardInfo onClick={onDateViewTypeChange}>
                <CardHeader
                    name={name}
                    timeAgo={<RelativeTime kind={kind} isRelativeTime={isRelative} date={date} />}
                />
                {nullable(description, () => (
                    <Dropdown
                        items={dropdownItems}
                        renderTrigger={({ ref, onClick }) => (
                            <IconMoreVerticalOutline size="xs" ref={ref} onClick={onClick} />
                        )}
                        renderItem={({ item }) => (
                            <StyledMenuItem key={item.label} ghost icon={item.icon} onClick={item.onClick}>
                                {item.label}
                            </StyledMenuItem>
                        )}
                    />
                ))}
            </StyledCardInfo>

            <CardComment>
                {description ? (
                    <Md>{description}</Md>
                ) : (
                    <Text size="s" color={gray7} weight="thin">
                        {tr('No description provided')}
                    </Text>
                )}
            </CardComment>
        </Card>
    );
};
