import { Session } from 'next-auth';

import { checkProjectAccess } from '../queries/project';
import { addCalculatedGoalsFields } from '../../src/utils/db/calculatedGoalsFields';
import { getProjectsEditableStatus } from '../../src/utils/db/getProjectEditable';

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

export const goalAccessChecker = async (session: Session, goal: GoalEntity) => {
    const { activityId, role } = session.user;
    const projectIds = [goal.projectId ?? ''];
    const editableMap = await getProjectsEditableStatus(projectIds, activityId, role);
    const { _isEditable, _isIssuer, _isOwner, _isParticipant, _isStarred, _isWatching } = addCalculatedGoalsFields(
        goal,
        { _isEditable: Boolean(goal.projectId && editableMap.get(goal.projectId)) },
        activityId,
        role,
    );

    const accessFromProjectLevel = goal.project && checkProjectAccess(goal.project, activityId, role);
    const accessByGoalLevel = _isParticipant || _isStarred || _isWatching || ((_isOwner || _isIssuer) && _isEditable);

    return accessFromProjectLevel || accessByGoalLevel ? allowed() : notAllowed(tr('No access to update Goal'));
};

export const goalEditAccessChecker = async (session: Session, goal: GoalEntity) => {
    const { activityId, role } = session.user;
    const projectIds = [goal.projectId ?? ''];
    const editableMap = await getProjectsEditableStatus(projectIds, activityId, role);
    const { _isEditable } = addCalculatedGoalsFields(
        goal,
        { _isEditable: Boolean(goal.projectId && editableMap.get(goal.projectId)) },
        activityId,
        role,
    );

    return goal.project && checkProjectAccess(goal.project, activityId, role) && _isEditable
        ? allowed()
        : notAllowed(tr('No access to update Goal'));
};

export const goalParticipantEditAccessChecker = async (session: Session, goal: GoalEntity) => {
    const base = await goalEditAccessChecker(session, goal);

    return base.allowed && !goal.project?.personal ? allowed() : notAllowed(tr('No access to update Goal'));
};

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

    const editableMap = await getProjectsEditableStatus([project.id], activityId, role);

    return checkProjectAccess(project, activityId, role) && editableMap.get(project.id)
        ? allowed()
        : notAllowed(tr('No access to update Project'));
};
