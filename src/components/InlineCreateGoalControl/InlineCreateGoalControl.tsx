import { IconPlusCircleOutline } from '@taskany/icons';

import { InlineTrigger } from '../InlineTrigger/InlineTrigger';
import { ModalEvent, dispatchModalEvent } from '../../utils/dispatchModal';
import { createGoalInlineControl } from '../../utils/domObjects';

import { tr } from './InlineCreateGoalControl.i18n';
import s from './InlineCreateGoalControl.module.css';

interface InlineCreateGoalControl extends React.HTMLAttributes<HTMLDivElement> {
    project: {
        id: string;
        title: string;
        flowId: string;
    };
}

export const InlineCreateGoalControl: React.FC<InlineCreateGoalControl> = ({ project, ...attrs }) => (
    <div className={s.InlineTriggerWrapper} {...attrs} {...createGoalInlineControl.attr}>
        <InlineTrigger
            text={tr('Create goal')}
            onClick={dispatchModalEvent(ModalEvent.GoalCreateModal, { project })}
            icon={<IconPlusCircleOutline size="s" />}
        />
    </div>
);
