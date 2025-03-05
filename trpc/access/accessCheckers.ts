import { Session } from 'next-auth';

import { checkProjectAccess } from '../queries/project';
import { addCalculatedGoalsFields } from '../../src/utils/db/calculatedGoalsFields';
import { db } from '../connection/kysely';
import { getProjectEditableSql } from '../queries/projectV2';

import { CommentEntity, GoalEntity, ProjectEntity } from './accessEntityGetters';
import { tr } from './access.i18n';

type AccessCheckerResult = Readonly<{ allowed: true } | { allowed: false; errorMessage: string }>;

export type EntityAccessChecker<TEntity> = (
    session: Session,
    entity: TEntity,
) => AccessCheckerResult | Promise<AccessCheckerResult>;

const allowed = (): AccessCheckerResult => ({
    allowed: true,
});

const notAllowed = (errorMessage: string): AccessCheckerResult => ({ allowed: false, errorMessage });

export const goalAccessChecker = (session: Session, goal: GoalEntity) => {
    const { activityId, role } = session.user;
    const { _isEditable, _isIssuer, _isOwner, _isParticipant, _isStarred, _isWatching } = addCalculatedGoalsFields(
        goal,
        activityId,
        role,
    );

    const accessFromProjectLevel = goal.project && checkProjectAccess(goal.project, activityId, role);
    const accessByGoalLevel = _isParticipant || _isStarred || _isWatching || ((_isOwner || _isIssuer) && _isEditable);

    return accessFromProjectLevel || accessByGoalLevel ? allowed() : notAllowed(tr('No access to update Goal'));
};

export const goalEditAccessChecker = (session: Session, goal: GoalEntity) => {
    const { activityId, role } = session.user;
    const { _isEditable } = addCalculatedGoalsFields(goal, activityId, role);

    return goal.project && checkProjectAccess(goal.project, activityId, role) && _isEditable
        ? allowed()
        : notAllowed(tr('No access to update Goal'));
};

export const goalParticipantEditAccessChecker = (session: Session, goal: GoalEntity) =>
    goalEditAccessChecker(session, goal) && !goal.project?.personal
        ? allowed()
        : notAllowed(tr('No access to update Goal'));

export const commentAccessChecker = (session: Session, comment: CommentEntity) => {
    const { activityId } = session.user;

    return comment.activityId === activityId ? allowed() : notAllowed(tr('No access to update Comment'));
};

export const projectAccessChecker = (session: Session, project: ProjectEntity) => {
    const { activityId, role } = session.user;

    return checkProjectAccess(project, activityId, role) ? allowed() : notAllowed(tr('No access to update Project'));
};

export const projectEditAccessChecker = async (session: Session, project: ProjectEntity) => {
    const { activityId, role } = session.user;

    const result = await db
        .selectFrom('Project')
        .select(() => [getProjectEditableSql(activityId, role).as('_isEditable')])
        .where('Project.id', '=', project.id)
        .executeTakeFirst();

    return checkProjectAccess(project, activityId, role) && result?._isEditable
        ? allowed()
        : notAllowed(tr('No access to update Project'));
};
