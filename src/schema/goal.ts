import { z } from 'zod';
import { StateType } from '@prisma/client';

import { tr } from './schema.i18n';
import { DateTypeEnum, queryWithFiltersSchema } from './common';
import { commentSchema } from './comment';

export const userGoalsSchema = queryWithFiltersSchema;

export type UserGoals = z.infer<typeof userGoalsSchema>;

export enum dependencyKind {
    dependsOn = 'dependsOn',
    blocks = 'blocks',
    relatedTo = 'relatedTo',
}

export const toggleGoalDependencySchema = z.object({
    id: z.string().optional(),
    kind: z.nativeEnum(dependencyKind),
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

export const goalCommonSchema = z.object({
    title: z
        .string({
            required_error: tr('Title is required'),
            invalid_type_error: tr("Goal's title must be a string"),
        })
        .min(10, {
            message: tr("Goal's description must be longer than 10 symbols"),
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
    parent: z.object(
        {
            id: z.string(),
            title: z.string(),
            flowId: z.string(),
        },
        {
            invalid_type_error: tr("Goal's project are is required"),
            required_error: tr("Goal's project are is required"),
        },
    ),
    state: z.object({
        id: z.string(),
        hue: z.number().optional(),
        title: z.string().optional(),
    }),
    priority: z.string().nullable().optional(),
    estimate: z
        .object({
            date: z.date(),
            type: DateTypeEnum,
        })
        .nullable()
        .optional(),
    tags: z
        .array(
            z.object({
                id: z.string(),
                title: z.string(),
            }),
        )
        .optional(),
    participants: z
        .array(
            z.object({
                id: z.string(),
            }),
        )
        .optional(),
});

export type GoalCommon = z.infer<typeof goalCommonSchema>;

export const goalUpdateSchema = z.object({
    id: z.string(),
    title: z
        .string({
            required_error: tr('Title is required'),
            invalid_type_error: tr("Goal's title must be a string"),
        })
        .min(10, {
            message: tr("Goal's description must be longer than 10 symbols"),
        }),
    description: z.string({
        required_error: tr("Goal's description is required"),
        invalid_type_error: tr("Goal's description must be a string"),
    }),
    owner: z.object({
        id: z.string(),
        user: z.object({
            nickname: z.string().nullable(),
            name: z.string().nullable(),
            email: z.string(),
        }),
    }),
    parent: z.object(
        {
            id: z.string(),
            title: z.string(),
            flowId: z.string(),
        },
        {
            invalid_type_error: tr("Goal's project are is required"),
            required_error: tr("Goal's project are is required"),
        },
    ),
    state: z.object({
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
    }),
    priority: z.string().nullable(),
    estimate: z
        .object({
            date: z.date(),
            type: DateTypeEnum,
        })
        .nullable()
        .optional(),
    tags: z.array(
        z.object({
            id: z.string(),
            title: z.string(),
        }),
    ),
});

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

export const batchGoalByProjectIdSchema = z.object({
    projectId: z.string(),
});

export type BatchGoalsByProjectIdSchema = z.infer<typeof batchGoalByProjectIdSchema>;
