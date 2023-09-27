import styled from 'styled-components';
import { gapSm } from '@taskany/colors';
import { IconPlusCircleOutline } from '@taskany/icons';

import { InlineTrigger } from '../InlineTrigger';
import { ModalEvent, dispatchModalEvent } from '../../utils/dispatchModal';
import { createGoalInlineControl } from '../../utils/domObjects';

import { tr } from './InlineCreateGoalControl.i18n';

interface InlineCreateGoalControl extends React.HTMLAttributes<HTMLDivElement> {
    projectId: string;
}

const StyledInlineTriggerWrapper = styled.div`
    padding-left: ${gapSm};
`;

export const InlineCreateGoalControl: React.FC<InlineCreateGoalControl> = ({ projectId, ...attrs }) => (
    <StyledInlineTriggerWrapper {...attrs} {...createGoalInlineControl.attr}>
        <InlineTrigger
            text={tr('Create goal')}
            onClick={dispatchModalEvent(ModalEvent.GoalCreateModal, {
                id: projectId,
            })}
            icon={<IconPlusCircleOutline size="s" />}
        />
    </StyledInlineTriggerWrapper>
);
