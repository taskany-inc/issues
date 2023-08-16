import { Prisma } from '@prisma/client';

import { QueryWithFilters } from '../../src/schema/common';

export const sqlGoalsFilter = (activityId: string, data?: QueryWithFilters) => {
    const projectFilter = data?.project?.length
        ? Prisma.sql`
            and g."projectId" in (${Prisma.join(data?.project)})
        `
        : Prisma.empty;

    const ownerFilter = data?.owner?.length
        ? Prisma.sql`
            and g."ownerId" in (${Prisma.join(data?.owner)})
        `
        : Prisma.empty;

    const issuerFilter = data?.issuer?.length
        ? Prisma.sql`
            and g."activityId" in (${Prisma.join(data?.issuer)})
        `
        : Prisma.empty;

    const priorityFilter = data?.priority?.length
        ? Prisma.sql`
            and g.priority in (${Prisma.join(data?.priority)})
        `
        : Prisma.empty;

    const stateFilter = data?.state?.length
        ? Prisma.sql`
            and g."stateId" in (${Prisma.join(data?.state)})
        `
        : Prisma.empty;

    const stateTypeFilter = Prisma.empty;
    // const stateTypeFilter = data?.stateType?.length
    //     ? Prisma.sql`
    //         and g.state.type" in (${Prisma.join(data?.stateType)})
    //     `
    //     : Prisma.empty;

    const starredFilter = data?.starred
        ? Prisma.sql`
            and (ps."A" = ${activityId} or gs."B" = g.id)
        `
        : Prisma.empty;

    const watchingFilter = data?.watching
        ? Prisma.sql`
            and (pw."B" = ${activityId} or gw."B" = g.id)
        `
        : Prisma.empty;

    const tagFilter = data?.tag?.length
        ? Prisma.sql`
            and t.id in (${Prisma.join(data?.tag)})
        `
        : Prisma.empty;

    const queryFilter = data?.query?.length
        ? Prisma.sql`
            and (g.title ilike ${`%${data?.query}%`}
                or g.description ilike ${`%${data?.query}%`}
                or p.title ilike ${`%${data?.query}%`}
                or p.description ilike ${`%${data?.query}%`})
        `
        : Prisma.empty;

    const participantFilter = data?.participant?.length
        ? Prisma.sql`
            and gp."A" in (${Prisma.join(data?.participant)})
        `
        : Prisma.empty;

    return Prisma.sql`
        ${projectFilter}
        ${ownerFilter}
        ${issuerFilter}
        ${priorityFilter}
        ${stateFilter}
        ${stateTypeFilter}
        ${starredFilter}
        ${watchingFilter}
        ${tagFilter}
        ${queryFilter}
        ${participantFilter}
    `;
};

export const fillProject = (
    projectsDict: Record<string, any>,
    { watcher, stargizer, project }: Record<string, any>,
) => {
    if (watcher && watcher.projectId in projectsDict) {
        const cur = projectsDict[watcher.projectId];
        cur.watchers.push(watcher);
        cur._count.watchers += 1;
    }

    if (stargizer && stargizer.projectId in projectsDict) {
        const cur = projectsDict[stargizer.projectId];
        cur.stargizers.push(stargizer);
        cur._count.stargizers += 1;
    }

    if (project && project.parentProjectId in projectsDict) {
        const cur = projectsDict[project.parentProjectId];
        cur.children.push({ id: project.projectId });
        cur._count.children += 1;
    }

    if (project && project.projectId in projectsDict) {
        const cur = projectsDict[project.projectId];
        cur.parent.push({ id: project.parentProjectId });
        cur._count.parent += 1;
    }
};
