export enum ModalEvent {
    GoalCreateModal = 'GoalCreateModal',
    GoalEditModal = 'GoalEditModal',
    ProjectCreateModal = 'ProjectCreateModal',
    UserInviteModal = 'UserInviteModal',
}

export const dispatchModalEvent = (e: ModalEvent) => () => {
    window.dispatchEvent(new Event(e));
};
