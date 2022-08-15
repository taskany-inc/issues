export enum ModalEvent {
    GoalCreateModal = 'GoalCreateModal',
    GoalEditModal = 'GoalEditModal',
    IssueParticipantsModal = 'IssueParticipantsModal',
    IssueDependenciesModal = 'IssueDependenciesModal',
    ProjectCreateModal = 'ProjectCreateModal',
    UserInviteModal = 'UserInviteModal',
}

export const dispatchModalEvent = (e: ModalEvent) => () => {
    window.dispatchEvent(new Event(e));
};
