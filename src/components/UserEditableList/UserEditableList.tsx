import { FC } from 'react';
import styled from 'styled-components';
import { nullable } from '@taskany/bricks';
import { IconXCircleSolid } from '@taskany/icons';
import { gapXs } from '@taskany/colors';

import { ActivityByIdReturnType } from '../../../trpc/inferredTypes';
import { safeUserData } from '../../utils/getUserName';
import { TextList, TextListItem } from '../TextList';
import { UserBadge } from '../UserBadge';
import { UserComboBox } from '../UserComboBox';
import { AddInlineTrigger } from '../AddInlineTrigger';

import { tr } from './UserEditableList.i18n';

const StyledInlineInput = styled.div`
    margin-top: ${gapXs};
    height: 28px; // Input height
`;

export const UserEditableList: FC<{
    editable: boolean;
    users: NonNullable<ActivityByIdReturnType[]>;
    filterIds: string[];
    onRemove: (id: string) => void;
    onAdd: (user: NonNullable<ActivityByIdReturnType>) => void;
    triggerText: string;
    className?: string;
}> = ({ editable, users, filterIds, triggerText, onRemove, onAdd, className }) => (
    <div className={className}>
        <TextList listStyle="none">
            {users?.map((activity) =>
                nullable(safeUserData(activity), (props) => (
                    <TextListItem key={activity.id}>
                        <UserBadge {...props}>
                            {nullable(editable, () => (
                                <IconXCircleSolid size="xs" onClick={() => onRemove(activity.id)} />
                            ))}
                        </UserBadge>
                    </TextListItem>
                )),
            )}
        </TextList>

        {nullable(editable, () => (
            <StyledInlineInput>
                <UserComboBox
                    placement="bottom-start"
                    placeholder={tr('Type user name or email')}
                    filter={filterIds}
                    onChange={onAdd}
                    renderTrigger={(props) => <AddInlineTrigger text={triggerText} onClick={props.onClick} />}
                />
            </StyledInlineInput>
        ))}
    </div>
);
