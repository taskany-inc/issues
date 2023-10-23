import { ComponentProps, FC, forwardRef } from 'react';
import styled from 'styled-components';
import { nullable } from '@taskany/bricks';
import { IconPlusCircleOutline, IconXCircleSolid } from '@taskany/icons';
import { gapXs } from '@taskany/colors';

import { ActivityByIdReturnType } from '../../../trpc/inferredTypes';
import { safeUserData } from '../../utils/getUserName';
import { TextList, TextListItem } from '../TextList';
import { UserBadge } from '../UserBadge';
import { UserComboBox } from '../UserComboBox';
import { InlineTrigger } from '../InlineTrigger';

import { tr } from './UserEditableList.i18n';

const inputHeight = '28px';

const StyledInlineTrigger = styled(InlineTrigger)`
    margin-left: 5px; // 24 / 2 - 7 center of UserPic and center of PlusIcon
    height: ${inputHeight};
`;

const StyledTriggerContainer = styled.div`
    margin-top: ${gapXs};
    height: ${inputHeight};
`;

interface UserEditableListTriggerProps {
    text: string;
    onClick: ComponentProps<typeof InlineTrigger>['onClick'];
    icon?: React.ReactNode;
}

export const UserEditableListTrigger = forwardRef<HTMLDivElement, UserEditableListTriggerProps>(
    ({ icon = <IconPlusCircleOutline size="xs" />, text, onClick }, ref) => (
        <StyledInlineTrigger ref={ref} icon={icon} text={text} onClick={onClick} />
    ),
);

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
            <StyledTriggerContainer>
                <UserComboBox
                    placement="bottom-start"
                    placeholder={tr('Type user name or email')}
                    filter={filterIds}
                    onChange={onAdd}
                    renderTrigger={(props) => <UserEditableListTrigger text={triggerText} onClick={props.onClick} />}
                />
            </StyledTriggerContainer>
        ))}
    </div>
);
