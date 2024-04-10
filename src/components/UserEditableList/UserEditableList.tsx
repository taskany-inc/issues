import { ComponentProps, FC } from 'react';
import styled from 'styled-components';
import { nullable } from '@taskany/bricks';
import { IconXCircleSolid } from '@taskany/icons';
import { User } from '@prisma/client';

import { safeUserData } from '../../utils/getUserName';
import { TextList, TextListItem } from '../TextList';
import { UserBadge } from '../UserBadge/UserBadge';
import { UserComboBox } from '../UserComboBox';
import { AddInlineTrigger } from '../AddInlineTrigger/AddInlineTrigger';

import { tr } from './UserEditableList.i18n';

const inputHeight = '28px';

const StyledInputContainer = styled.div`
    margin-top: var(--gap-xs);
    height: ${inputHeight};
`;

export const UserEditableList: FC<{
    editable?: boolean;
    users: { id: string; user: User | null }[];
    filterIds: string[];
    onRemove: (id: string) => void;
    onAdd: ComponentProps<typeof UserComboBox>['onChange'];
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
            <StyledInputContainer>
                <UserComboBox
                    placement="bottom-start"
                    placeholder={tr('Type user name or email')}
                    filter={filterIds}
                    onChange={onAdd}
                    renderTrigger={(props) => <AddInlineTrigger text={triggerText} onClick={props.onClick} />}
                />
            </StyledInputContainer>
        ))}
    </div>
);
