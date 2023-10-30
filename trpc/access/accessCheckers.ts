import { Session } from 'next-auth';

import { addCalculatedGoalsFields } from '../queries/goals';
import { addCalculatedProjectFields, checkProjectAccess } from '../queries/project';

import { CommentEntity, GoalEntity, ProjectEntity } from './accessEntityGetters';

type AccessCheckerResult = Readonly<{ allowed: true } | { allowed: false; errorMessage: string }>;

export type EntityAccessChecker<TEntity> = (session: Session, entity: TEntity) => AccessCheckerResult;

const allowed = (): AccessCheckerResult => ({
    allowed: true,
});

const notAllowed = (errorMessage: string): AccessCheckerResult => ({ allowed: false, errorMessage });

export const goalAccessChecker = (session: Session, goal: GoalEntity) => {
    const { activityId, role } = session.user;

    return goal.project && checkProjectAccess(goal.project, activityId, role)
        ? allowed()
        : notAllowed('No access to update Goal');
};

export const goalEditAccessChecker = (session: Session, goal: GoalEntity) => {
    const { activityId, role } = session.user;
    const { _isEditable } = addCalculatedGoalsFields(goal, activityId, role);

    return goal.project && checkProjectAccess(goal.project, activityId, role) && _isEditable
        ? allowed()
        : notAllowed('No access to update Goal');
};

export const commentAccessChecker = (session: Session, comment: CommentEntity) => {
    const { activityId } = session.user;

    return comment.activityId === activityId ? allowed() : notAllowed('No access to update Comment');
};

export const projectAccessChecker = (session: Session, project: ProjectEntity) => {
    const { activityId, role } = session.user;

    return checkProjectAccess(project, activityId, role) ? allowed() : notAllowed('No access to update Project');
};

export const projectEditAccessChecker = (session: Session, project: ProjectEntity) => {
    const { activityId, role } = session.user;

    const { _isEditable } = addCalculatedProjectFields(project, activityId, role);

    return checkProjectAccess(project, activityId, role) && _isEditable
        ? allowed()
        : notAllowed('No access to update Project');
};
