import { GoalByIdReturnType, GoalCreateReturnType } from '../../trpc/inferredTypes';

export enum ModalEvent {
    GoalCreateModal = 'GoalCreateModal',
    GoalEditModal = 'GoalEditModal',
    GoalDeleteModal = 'GoalDeleteModal',
    ProjectCreateModal = 'ProjectCreateModal',
    ProjectTransferModal = 'ProjectTransferModal',
    ProjectDeleteModal = 'ProjectDeleteModal',
    ProjectCannotDeleteModal = 'ProjectCannotDeleteModal',
    UserInviteModal = 'UserInviteModal',
    FilterCreateModal = 'FilterCreateModal',
    FilterDeleteModal = 'FilterDeleteModal',
    FeedbackCreateModal = 'FeedbackCreateModal',
    WhatsNewModal = 'WhatsNewModal',
    ImageFullScreen = 'ImageFullScreen',
    GoalPreviewModal = 'GoalPreviewModal',
    AccessUserDeleteError = 'AccessUserDeleteError',
}

export interface MapModalToComponentProps {
    [ModalEvent.GoalCreateModal]: {
        project?: {
            id: string;
            title: string;
            flowId: string;
        };
        title?: string;
        onGoalCreate?: (goal: GoalCreateReturnType) => void;
    };
    [ModalEvent.GoalEditModal]: unknown;
    [ModalEvent.GoalDeleteModal]: unknown;
    [ModalEvent.ProjectCreateModal]: unknown;
    [ModalEvent.ProjectTransferModal]: unknown;
    [ModalEvent.ProjectDeleteModal]: unknown;
    [ModalEvent.ProjectCannotDeleteModal]: unknown;
    [ModalEvent.UserInviteModal]: unknown;
    [ModalEvent.FilterCreateModal]: unknown;
    [ModalEvent.FilterDeleteModal]: unknown;
    [ModalEvent.FeedbackCreateModal]: unknown;
    [ModalEvent.WhatsNewModal]: unknown;
    [ModalEvent.ImageFullScreen]: {
        src: string;
        alt?: string;
    };
    [ModalEvent.GoalPreviewModal]: {
        type: 'on:goal:update' | 'on:goal:delete';
    };
    [ModalEvent.AccessUserDeleteError]: {
        goals: Pick<NonNullable<GoalByIdReturnType>, 'title' | '_shortId'>[];
    };
}

interface DispatchModalEvent {
    <K extends ModalEvent, P extends MapModalToComponentProps[K]>(event: K, props?: P): () => void;
}

export const dispatchModalEvent: DispatchModalEvent = (ev, props) => () => {
    const event = new CustomEvent<typeof props>(ev, { detail: props, bubbles: true, cancelable: true });
    window.dispatchEvent(event);
};
