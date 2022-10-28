export enum ModalEvent {
    GoalCreateModal = 'GoalCreateModal',
    GoalEditModal = 'GoalEditModal',
    IssueParticipantsModal = 'IssueParticipantsModal',
    IssueDependenciesModal = 'IssueDependenciesModal',
    ProjectCreateModal = 'ProjectCreateModal',
    ProjectDeleteModal = 'ProjectDeleteModal',
    UserInviteModal = 'UserInviteModal',
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const dispatchModalEvent = (e: ModalEvent, props?: any) => () => {
    window.dispatchEvent(new CustomEvent(e, { detail: props }));
};
