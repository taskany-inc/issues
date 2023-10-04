import { Card, CardComment, CardInfo, Text } from '@taskany/bricks';
import { ComponentProps, FC } from 'react';
import { gray7 } from '@taskany/colors';
import dynamic from 'next/dynamic';

import { CardHeader } from '../CardHeader';
import { RelativeTime } from '../RelativeTime/RelativeTime';
import { useClickSwitch } from '../../hooks/useClickSwitch';

import { tr } from './GoalContentHeader.i18n';

const Md = dynamic(() => import('../Md'));

interface GoalContentHeaderProps extends Pick<ComponentProps<typeof RelativeTime>, 'date' | 'kind'> {
    name?: string | null;
    description?: string;
}

export const GoalContentHeader: FC<GoalContentHeaderProps> = ({ name, description, date, kind }) => {
    const [isRelative, onDateViewTypeChange] = useClickSwitch();
    return (
        <Card>
            <CardInfo onClick={onDateViewTypeChange}>
                <CardHeader
                    name={name}
                    timeAgo={<RelativeTime kind={kind} isRelativeTime={isRelative} date={date} />}
                />
            </CardInfo>

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
