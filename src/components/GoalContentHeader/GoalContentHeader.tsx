import { Card, CardComment, CardInfo, Dropdown, MenuItem, Text, nullable, useCopyToClipboard } from '@taskany/bricks';
import { ComponentProps, FC, useCallback, useMemo } from 'react';
import { gray7, textColor } from '@taskany/colors';
import dynamic from 'next/dynamic';
import { IconClipboardOutline, IconMoreVerticalOutline } from '@taskany/icons';
import styled from 'styled-components';
import * as Sentry from '@sentry/nextjs';

import { CardHeader } from '../CardHeader';
import { RelativeTime } from '../RelativeTime/RelativeTime';
import { useClickSwitch } from '../../hooks/useClickSwitch';
import { notifyPromise } from '../../utils/notifyPromise';
import { Light } from '../Light';

import { tr } from './GoalContentHeader.i18n';

const Md = dynamic(() => import('../Md'));

const StyledCardInfo = styled(CardInfo)`
    display: flex;
    justify-content: space-between;
    align-items: center;
`;

interface GoalContentHeaderProps extends Pick<ComponentProps<typeof RelativeTime>, 'date' | 'kind'> {
    name?: string | null;
    description?: string;
}

export const GoalContentHeader: FC<GoalContentHeaderProps> = ({ name, description, date, kind }) => {
    const [isRelative, onDateViewTypeChange] = useClickSwitch();

    const onError = useCallback((err: Error) => {
        Sentry.captureException(err);
    }, []);

    const [, copyValue] = useCopyToClipboard(onError);

    const onCopyDescription = useCallback(() => {
        if (!description) return;

        notifyPromise(copyValue(description), 'copy');
    }, [copyValue, description]);

    const dropdownItems = useMemo(() => {
        return [
            {
                label: tr('Copy raw'),
                icon: <IconClipboardOutline size="xxs" />,
                onClick: onCopyDescription,
            },
        ];
    }, [onCopyDescription]);

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
                            <Light color={textColor} ref={ref} onClick={onClick}>
                                <IconMoreVerticalOutline size="xs" />
                            </Light>
                        )}
                        renderItem={({ item }) => (
                            <MenuItem key={item.label} ghost icon={item.icon} onClick={item.onClick}>
                                {item.label}
                            </MenuItem>
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
