export enum ModalEvent {
    GoalCreateModal = 'GoalCreateModal',
    GoalEditModal = 'GoalEditModal',
    GoalDeleteModal = 'GoalDeleteModal',
    IssueParticipantsModal = 'IssueParticipantsModal',
    IssueDependenciesModal = 'IssueDependenciesModal',
    TeamCreateModal = 'TeamCreateModal',
    TeamDeleteModal = 'TeamDeleteModal',
    ProjectCreateModal = 'ProjectCreateModal',
    ProjectDeleteModal = 'ProjectDeleteModal',
    UserInviteModal = 'UserInviteModal',
}

export const dispatchModalEvent = (e: ModalEvent) => () => {
    window.dispatchEvent(new Event(e));
};
