import { z } from 'zod';

import { tr } from './schema.i18n';
import { queryWithFiltersSchema } from './common';

export const userGoalsSchema = queryWithFiltersSchema;

export type UserGoals = z.infer<typeof userGoalsSchema>;

export enum dependencyKind {
    dependsOn = 'dependsOn',
    blocks = 'blocks',
    relatedTo = 'relatedTo',
}

export const toogleGoalDependencySchema = z.object({
    id: z.string(),
    target: z.string(),
    direction: z.boolean(),
    kind: z.nativeEnum(dependencyKind),
});

export type ToggleGoalDependency = z.infer<typeof toogleGoalDependencySchema>;

export const toogleGoalArchiveSchema = z.object({
    id: z.string(),
    archived: z.boolean(),
});

export type ToggleGoalArchive = z.infer<typeof toogleGoalDependencySchema>;

export const goalCommonSchema = z.object({
    title: z
        .string({
            required_error: tr("Goal's title is required"),
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
            invalid_type_error: tr("Goal's project or team are required"),
            required_error: tr("Goal's project or team are required"),
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
            date: z.string(),
            q: z.string(),
            y: z.string(),
            id: z.number().nullish(),
        })
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
            required_error: tr("Goal's title is required"),
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
            invalid_type_error: tr("Goal's project or team are required"),
            required_error: tr("Goal's project or team are required"),
        },
    ),
    state: z.object({
        id: z.string(),
        hue: z.number().optional(),
        title: z.string().optional(),
    }),
    priority: z.string().nullable(),
    estimate: z
        .object({
            date: z.string(),
            q: z.string(),
            y: z.string(),
            id: z.number().nullish(),
        })
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

export const goalParticipantsSchema = z.object({
    id: z.string(),
    participants: z.array(
        z.object({
            id: z.string(),
            name: z.string(),
        }),
    ),
});

export type GoalParticipantsSchema = z.infer<typeof goalParticipantsSchema>;

export const goalStateChangeSchema = z.object({
    id: z.string(),
    state: z.object({
        id: z.string(),
        title: z.string(),
    }),
});

export type GoalStateChangeSchema = z.infer<typeof goalStateChangeSchema>;
