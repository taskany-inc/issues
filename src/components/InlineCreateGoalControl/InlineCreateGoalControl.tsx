import { ModalEvent, dispatchModalEvent } from '../../utils/dispatchModal';
import { createGoalInlineControl } from '../../utils/domObjects';
import { AddInlineTrigger } from '../AddInlineTrigger/AddInlineTrigger';

import { tr } from './InlineCreateGoalControl.i18n';

interface InlineCreateGoalControl {
    project: {
        id: string;
        title: string;
        flowId: string;
    };
}

export const InlineCreateGoalControl: React.FC<InlineCreateGoalControl> = ({ project, ...attrs }) => (
    <AddInlineTrigger
        {...attrs}
        {...createGoalInlineControl.attr}
        text={tr('Create goal')}
        onClick={dispatchModalEvent(ModalEvent.GoalCreateModal, { project })}
    />
);
