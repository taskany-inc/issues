import { Project } from '../../graphql/@generated/genql';

export type LastOrCurrentProject = Partial<Project> | null;
export type RecentProjectsCache = Record<string, { rate: number; cache: Partial<Project> }>;
