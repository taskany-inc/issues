import { useMemo } from 'react';

import { Goal, Project, Team } from '../../graphql/@generated/genql';

export interface ProjectGroup {
    data: Project;
    teams?: Array<Team>;
    goals: Goal[];
}

export interface TeamGroup {
    data: Team;
    goals: Goal[];
}

export interface GoalsGroups {
    teams: Record<number, TeamGroup>;
    projects: Record<number, ProjectGroup>;
}

// TODO: it may be calculated in gql resolver
export const useGrouppedGoals = (goals?: Goal[]) => {
    return useMemo(() => {
        const groups = (goals ?? []).reduce<GoalsGroups>(
            (acc, goal) => {
                if (goal.team) {
                    const team = acc.teams[goal.team.id] || {
                        data: goal.team,
                        goals: [],
                    };

                    team.goals.push(goal);
                    acc.teams[goal.team.id] = team;
                }

                if (goal.project) {
                    const project = acc.projects[goal.project.id] || {
                        data: goal.project,
                        goals: [],
                    };

                    // sort teams by title
                    project.teams = goal.project.teams?.length
                        ? goal.project.teams?.sort((a, b) => (a.title > b.title ? 1 : -1))
                        : undefined;

                    project.goals.push(goal);
                    acc.projects[goal.project.id] = project;
                }

                return acc;
            },
            { teams: {}, projects: {} },
        );

        return {
            teams: Object.values(groups.teams),
            projects: Object.values(groups.projects).sort((a, b) => (a.teams && !b.teams ? -1 : 1)),
        };
    }, [goals]);
};
