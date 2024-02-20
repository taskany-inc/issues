import styled from 'styled-components';
import { IconPlusCircleOutline } from '@taskany/icons';

import { InlineTrigger } from '../InlineTrigger';
import { ModalEvent, dispatchModalEvent } from '../../utils/dispatchModal';
import { createGoalInlineControl } from '../../utils/domObjects';

import { tr } from './InlineCreateGoalControl.i18n';

interface InlineCreateGoalControl extends React.HTMLAttributes<HTMLDivElement> {
    project: {
        id: string;
        title: string;
        flowId: string;
    };
}

const StyledInlineTriggerWrapper = styled.div`
    padding: var(--gap-s);
    width: fit-content;
`;

export const InlineCreateGoalControl: React.FC<InlineCreateGoalControl> = ({ project, ...attrs }) => (
    <StyledInlineTriggerWrapper {...attrs} {...createGoalInlineControl.attr}>
        <InlineTrigger
            text={tr('Create goal')}
            onClick={dispatchModalEvent(ModalEvent.GoalCreateModal, { project })}
            icon={<IconPlusCircleOutline size="s" />}
        />
    </StyledInlineTriggerWrapper>
);
