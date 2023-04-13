import React, { useCallback, useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';
import z from 'zod';
import useSWR from 'swr';
import styled from 'styled-components';
import dynamic from 'next/dynamic';
import { gapS, gray6, gray10 } from '@taskany/colors';
import {
    Button,
    Text,
    InputContainer,
    Link,
    Form,
    FormActions,
    FormAction,
    FormTextarea,
    FormInput,
    FormTitle,
    BulbOnIcon,
    QuestionIcon,
    ModalHeader,
    ModalContent,
    nullable,
} from '@taskany/bricks';

import { createFetcher } from '../utils/createFetcher';
import { gql } from '../utils/gql';
import { submitKeys } from '../utils/hotkeys';
import { errorsProvider } from '../utils/forms';
import { keyPredictor } from '../utils/keyPredictor';
import { routes, useRouter } from '../hooks/router';
import { usePageContext } from '../hooks/usePageContext';
import { useDebouncedEffect } from '../hooks/useDebouncedEffect';
import { dispatchModalEvent, ModalEvent } from '../utils/dispatchModal';

import { FlowComboBox } from './FlowComboBox';
import { Keyboard } from './Keyboard';
import { Tip } from './Tip';

const KeyInput = dynamic(() => import('./KeyInput'));

const flowFetcher = createFetcher(() => ({
    flowRecommended: {
        id: true,
        title: true,
        states: {
            id: true,
            title: true,
        },
    },
}));
const teamsFetcher = createFetcher((_, id: string) => ({
    team: [
        {
            id,
        },
        {
            id: true,
            title: true,
        },
    ],
}));

const StyledTitleContainer = styled.div`
    display: flex;
    position: relative;
`;

const StyledTeamKeyContainer = styled.div`
    position: relative;
`;

const StyledFormBottom = styled.div`
    display: flex;
    align-items: flex-end;
    justify-content: space-between;

    padding: ${gapS} ${gapS} 0 ${gapS};
`;

const StyledTeamKeyInputContainer = styled(InputContainer)`
    box-sizing: border-box;
    width: fit-content;
    padding-right: ${gapS};
`;

const schemaProvider = (t: (key: string) => string) =>
    z.object({
        id: z.string().min(3),
        title: z
            .string({
                required_error: t("Team's title is required"),
                invalid_type_error: t("Team's title must be a string"),
            })
            .min(2, {
                message: t("Team's title must be longer than 2 symbols"),
            })
            .max(50, {
                message: t("Team's title can be 50 symbols maximum"),
            }),
        description: z.string().optional(),
        flow: z.object({
            id: z.string(),
        }),
    });

export type TeamFormType = z.infer<ReturnType<typeof schemaProvider>>;

const TeamCreateForm: React.FC = () => {
    const t = useTranslations('teams.new');

    const router = useRouter();
    const { locale, user } = usePageContext();

    const [focusedInput, setFocusedInput] = useState(false);
    const [hoveredInput, setHoveredInput] = useState(false);
    const [busy, setBusy] = useState(false);
    const [dirtyKey, setDirtyKey] = useState(false);

    const schema = schemaProvider(t);

    const {
        register,
        handleSubmit,
        watch,
        setFocus,
        setValue,
        control,
        formState: { errors, isValid, isSubmitted },
    } = useForm<TeamFormType>({
        resolver: zodResolver(schema),
        mode: 'onChange',
        reValidateMode: 'onChange',
        shouldFocusError: false,
    });

    useEffect(() => {
        setTimeout(() => setFocus('title'), 0);
    }, [setFocus]);

    const errorsResolver = errorsProvider(errors, isSubmitted);
    const titleWatcher = watch('title');
    const keyWatcher = watch('id');

    useDebouncedEffect(
        () => {
            if (!dirtyKey && titleWatcher && titleWatcher !== '') {
                setValue('id', keyPredictor(titleWatcher));
            }
        },
        300,
        [setValue, titleWatcher],
    );

    const isKeyEnoughLength = Boolean(keyWatcher?.length >= 3);
    const { data: flowData } = useSWR('flow', () => flowFetcher(user));
    const { data: teamsData } = useSWR(isKeyEnoughLength ? [user, keyWatcher] : null, teamsFetcher);
    const isKeyUnique = !teamsData?.team;

    useEffect(() => {
        if (flowData?.flowRecommended) {
            setValue('flow', flowData?.flowRecommended[0]);
        }
    }, [setValue, flowData?.flowRecommended]);

    const createTeam = async (form: TeamFormType) => {
        setBusy(true);

        const promise = gql.mutation({
            createTeam: [
                {
                    data: {
                        id: form.id,
                        title: form.title,
                        description: form.description,
                        flowId: form.flow.id,
                    },
                },
                {
                    id: true,
                },
            ],
        });

        toast.promise(promise, {
            error: t('Something went wrong 😿'),
            loading: t('We are creating new team'),
            success: t('Voila! Team is here 🎉'),
        });

        const res = await promise;

        res.createTeam?.id && router.team(res.createTeam.id);
        dispatchModalEvent(ModalEvent.TeamCreateModal)();
    };

    const onKeyDirty = useCallback(() => {
        setDirtyKey(true);
    }, []);

    const richProps = {
        b: (c: React.ReactNode) => (
            <Text as="span" size="s" weight="bolder">
                {c}
            </Text>
        ),
        key: () => keyWatcher,
    };

    // eslint-disable-next-line no-nested-ternary
    const tooltip = isKeyEnoughLength
        ? isKeyUnique
            ? t.rich('Perfect! Issues in your team will look like', richProps)
            : t.rich('Team with key already exists', richProps)
        : t('Key must be 3 or longer characters');

    return (
        <>
            <ModalHeader>
                <FormTitle>{t('Create new team')}</FormTitle>
            </ModalHeader>

            <ModalContent>
                <Form onSubmit={isKeyUnique ? handleSubmit(createTeam) : undefined} submitHotkey={submitKeys}>
                    <StyledTitleContainer>
                        <FormInput
                            {...register('title')}
                            placeholder={t("Team's title")}
                            flat="bottom"
                            brick="right"
                            disabled={busy}
                            error={errorsResolver('title')}
                            onMouseEnter={() => setHoveredInput(true)}
                            onMouseLeave={() => setHoveredInput(false)}
                            onFocus={() => setFocusedInput(true)}
                            onBlur={() => setFocusedInput(false)}
                        />

                        {nullable(titleWatcher, () => (
                            <StyledTeamKeyContainer>
                                <Controller
                                    name="id"
                                    control={control}
                                    render={({ field }) => (
                                        <StyledTeamKeyInputContainer
                                            brick="left"
                                            hovered={hoveredInput}
                                            focused={focusedInput}
                                        >
                                            <KeyInput
                                                disabled={busy}
                                                available={isKeyUnique && isKeyEnoughLength}
                                                tooltip={tooltip}
                                                onDirty={onKeyDirty}
                                                error={errorsResolver('id')}
                                                {...field}
                                            />
                                        </StyledTeamKeyInputContainer>
                                    )}
                                />
                            </StyledTeamKeyContainer>
                        ))}
                    </StyledTitleContainer>

                    <FormTextarea
                        {...register('description')}
                        placeholder={t('And its description')}
                        flat="both"
                        disabled={busy}
                        error={errorsResolver('description')}
                    />

                    <FormActions flat="top">
                        <FormAction left inline>
                            <Controller
                                name="flow"
                                control={control}
                                render={({ field }) => (
                                    <FlowComboBox
                                        disabled
                                        text={t('Flow')}
                                        placeholder={t('Flow or state title')}
                                        error={errorsResolver(field.name)}
                                        {...field}
                                    />
                                )}
                            />
                        </FormAction>
                        <FormAction right inline>
                            <Button
                                view="primary"
                                disabled={busy}
                                outline={!isValid || !isKeyUnique || !isKeyEnoughLength}
                                type="submit"
                                text={t('Create team')}
                            />
                        </FormAction>
                    </FormActions>
                </Form>

                <StyledFormBottom>
                    <Tip title={t('Pro tip!')} icon={<BulbOnIcon size="s" color={gray10} />}>
                        {t.rich('Press key to create the team', {
                            key: () => <Keyboard command enter />,
                        })}
                    </Tip>

                    <Link href={routes.help(locale, 'teams')}>
                        <QuestionIcon size="s" color={gray6} />
                    </Link>
                </StyledFormBottom>
            </ModalContent>
        </>
    );
};

export default TeamCreateForm;
