import { z } from 'zod';
import { StateType, DateType } from '@prisma/client';

import { tr } from './schema.i18n';
import { queryWithFiltersSchema } from './common';
import { commentSchema } from './comment';

export const userGoalsSchema = queryWithFiltersSchema;

export type UserGoals = z.infer<typeof userGoalsSchema>;

export enum dependencyKind {
    dependsOn = 'dependsOn',
    blocks = 'blocks',
    relatedTo = 'relatedTo',
}

/* based on goals relation schema (relatedTo - connected) */
export enum exceptionsDependencyKind {
    connected = 'connected',
}

export const toggleGoalDependencySchema = z.object({
    id: z.string().optional(),
    kind: z.union([z.nativeEnum(dependencyKind), z.nativeEnum(exceptionsDependencyKind)]),
    relation: z.object({
        id: z.string({
            required_error: tr('Choose a dependency'),
        }),
    }),
});

export type ToggleGoalDependency = z.infer<typeof toggleGoalDependencySchema>;

export const toggleGoalArchiveSchema = z.object({
    id: z.string(),
    archived: z.boolean(),
});

export type ToggleGoalArchive = z.infer<typeof toggleGoalArchiveSchema>;

export const goalCommonSchema = z
    .discriminatedUnion('mode', [
        z.object({
            mode: z.literal('personal'),
            parent: z.object({}).nullish(),
        }),
        z.object({
            mode: z.literal('default'),
            parent: z.object(
                {
                    id: z.string(),
                    title: z.string(),
                    flowId: z.string(),
                },
                {
                    required_error: tr("Goal's project is required"),
                    invalid_type_error: tr("Goal's project is required"),
                },
            ),
        }),
    ])
    .and(
        z.object({
            title: z
                .string({
                    required_error: tr('Title is required'),
                    invalid_type_error: tr("Goal's title must be a string"),
                })
                .min(6, {
                    message: tr("Goal's title must be longer than 6 symbols"),
                }),
            description: z
                .string({
                    required_error: tr("Goal's description is required"),
                    invalid_type_error: tr("Goal's description must be a string"),
                })
                .optional(),
            owner: z.object({
                id: z.string(),
            }),
            state: z.object(
                {
                    id: z.string(),
                    hue: z.number().optional(),
                    title: z.string().optional(),
                },
                {
                    invalid_type_error: tr('State is required'),
                    required_error: tr('State is required'),
                },
            ),
            priority: z.object({
                id: z.string(),
                title: z.string(),
                value: z.number(),
                default: z.boolean(),
            }),
            estimate: z
                .object({
                    date: z.string(),
                    type: z.enum([DateType.Quarter, DateType.Strict, DateType.Year]),
                })
                .nullish(),
            tags: z
                .array(
                    z.object({
                        id: z.string(),
                        title: z.string(),
                    }),
                )
                .optional(),
        }),
    );

export type GoalCommon = z.infer<typeof goalCommonSchema>;

export const goalUpdateSchema = z
    .discriminatedUnion('mode', [
        z.object({
            mode: z.literal('personal'),
            parent: z.object({}).optional(),
        }),
        z.object({
            mode: z.literal('default'),
            parent: z.object(
                {
                    id: z.string(),
                    title: z.string(),
                    flowId: z.string(),
                },
                {
                    required_error: 'Project is required',
                    invalid_type_error: 'Project is required',
                },
            ),
        }),
    ])
    .and(
        z.object({
            id: z.string(),
            title: z
                .string({
                    required_error: tr('Title is required'),
                    invalid_type_error: tr("Goal's title must be a string"),
                })
                .min(6, {
                    message: tr("Goal's title must be longer than 6 symbols"),
                }),
            description: z.string({
                required_error: tr("Goal's description is required"),
                invalid_type_error: tr("Goal's description must be a string"),
            }),
            owner: z.object({
                id: z.string(),
                user: z.object({
                    email: z.string(),
                }),
            }),
            state: z.object(
                {
                    id: z.string(),
                    hue: z.number().optional(),
                    title: z.string().optional(),
                    type: z.enum([
                        StateType.Canceled,
                        StateType.Completed,
                        StateType.Failed,
                        StateType.InProgress,
                        StateType.NotStarted,
                    ]),
                },
                {
                    invalid_type_error: 'State is requered',
                },
            ),
            priority: z.object({
                id: z.string(),
                title: z.string(),
                value: z.number(),
                default: z.boolean(),
            }),
            estimate: z
                .object({
                    date: z.string(),
                    type: z.enum([DateType.Quarter, DateType.Strict, DateType.Year]),
                })
                .nullish(),
            tags: z.array(
                z.object({
                    id: z.string(),
                    title: z.string(),
                }),
            ),
        }),
    );

export type GoalUpdate = z.infer<typeof goalUpdateSchema>;

export const goalChangeProjectSchema = z.object({
    id: z.string(),
    projectId: z.string(),
});

export type GoalChangeProject = z.infer<typeof goalChangeProjectSchema>;

export const toggleParticipantsSchema = z.object({
    id: z.string(),
    activityId: z.string(),
});

export const goalStateChangeSchema = z.object({
    id: z.string(),
    state: z.object({
        id: z.string(),
        title: z.string(),
        type: z.enum([
            StateType.Canceled,
            StateType.Completed,
            StateType.Failed,
            StateType.InProgress,
            StateType.NotStarted,
        ]),
    }),
});

export type GoalStateChangeSchema = z.infer<typeof goalStateChangeSchema>;

export const goalCommentFormSchema = commentSchema.extend({
    stateId: z.string().optional(),
});

export type GoalCommentFormSchema = z.infer<typeof goalCommentFormSchema>;

export const goalCommentCreateSchema = goalCommentFormSchema.extend({
    goalId: z.string(),
});

export type GoalCommentCreateSchema = z.infer<typeof goalCommentCreateSchema>;

export const togglePartnerProjectSchema = z.object({
    id: z.string(),
    projectId: z.string(),
});

export type TogglePartnerProjectSchema = z.infer<typeof togglePartnerProjectSchema>;
