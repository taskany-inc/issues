import { Session } from 'next-auth';

import { addCalclulatedGoalsFields } from '../queries/goals';
import { addCalculatedProjectFields } from '../queries/project';

import { CommentEntity, GoalEntity, ProjectEntity } from './accessEntityGetters';

type AccessCheckerResult = Readonly<{ allowed: true } | { allowed: false; errorMessage: string }>;

export type EntityAccessChecker<TEntity> = (session: Session, entity: TEntity) => AccessCheckerResult;

const allowed = (): AccessCheckerResult => ({
    allowed: true,
});

const notAllowed = (errorMessage: string): AccessCheckerResult => ({ allowed: false, errorMessage });

export const goalAccessChecker = (session: Session, goal: GoalEntity) => {
    const { activityId, role } = session.user;
    const { _isEditable } = addCalclulatedGoalsFields(goal, activityId, role);

    return _isEditable ? allowed() : notAllowed('No access to update Goal');
};

export const commentAccessChecker = (session: Session, comment: CommentEntity) => {
    const { activityId } = session.user;

    return comment.activityId === activityId ? allowed() : notAllowed('No access to update Comment');
};

export const projectAccessChecker = (session: Session, project: ProjectEntity) => {
    const { activityId, role } = session.user;

    const { _isEditable } = addCalculatedProjectFields(project, activityId, role);

    return _isEditable ? allowed() : notAllowed('No access to update Project');
};
