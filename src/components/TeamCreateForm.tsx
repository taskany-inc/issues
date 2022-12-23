import React, { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';
import z from 'zod';
import useSWR from 'swr';
import styled from 'styled-components';

import { gapS, gray6, star0 } from '../design/@generated/themes';
import { createFetcher } from '../utils/createFetcher';
import { nullable } from '../utils/nullable';
import { gql } from '../utils/gql';
import { submitKeys } from '../utils/hotkeys';
import { errorsProvider } from '../utils/forms';
import { routes, useRouter } from '../hooks/router';
import { usePageContext } from '../hooks/usePageContext';

import { Icon } from './Icon';
import { Button } from './Button';
import { FormInput } from './FormInput';
import { FormTextarea } from './FormTextarea';
import { FormActions, FormAction } from './FormActions';
import { Form } from './Form';
import { Tip } from './Tip';
import { Keyboard } from './Keyboard';
import { FormTitle } from './FormTitle';
import { Link } from './Link';
import { ModalContent, ModalHeader } from './Modal';
import { InputContainer } from './InputContaier';

const teamsFetcher = createFetcher((_, title: string) => ({
    teams: [
        {
            data: {
                title,
            },
        },
        {
            title: true,
        },
    ],
}));

const StyledTitleContainer = styled.div`
    display: flex;
    position: relative;
`;

const StyledProjectKeyContainer = styled.div`
    position: relative;
`;

const StyledFormBottom = styled.div`
    display: flex;
    align-items: flex-end;
    justify-content: space-between;

    padding: ${gapS} ${gapS} 0 ${gapS};
`;

const StyledProjectKeyInputContainer = styled(InputContainer)`
    box-sizing: border-box;
    width: fit-content;
    padding-right: ${gapS};
`;

const schemaProvider = (t: (key: string) => string) =>
    z.object({
        title: z
            .string({
                required_error: t("Team's title is required"),
                invalid_type_error: t("Team's title must be a string"),
            })
            .min(2, {
                message: t("Team's title must be longer than 2 symbols"),
            }),
        description: z.string().optional(),
    });

export type TeamFormType = z.infer<ReturnType<typeof schemaProvider>>;

const TeamCreateForm: React.FC = () => {
    const t = useTranslations('teams.new');

    const router = useRouter();
    const { locale, user } = usePageContext();

    const [focusedInput, setFocusedInput] = useState(false);
    const [hoveredInput, setHoveredInput] = useState(false);

    const schema = schemaProvider(t);

    const {
        register,
        handleSubmit,
        watch,
        setFocus,
        formState: { errors, isValid, isSubmitted },
    } = useForm<TeamFormType>({
        resolver: zodResolver(schema),
        mode: 'onChange',
        reValidateMode: 'onChange',
        shouldFocusError: true,
    });

    useEffect(() => {
        setTimeout(() => setFocus('title'), 0);
    }, [setFocus]);

    const errorsResolver = errorsProvider(errors, isSubmitted);
    const titleWatcher = watch('title');

    const { data: teamsData } = useSWR(titleWatcher && titleWatcher !== '' ? [user, titleWatcher] : null, (...args) =>
        teamsFetcher(...args),
    );

    const createTeam = async (form: TeamFormType) => {
        const promise = gql.mutation({
            createTeam: [
                {
                    data: {
                        title: form.title,
                        description: form.description,
                    },
                },
                {
                    slug: true,
                },
            ],
        });

        toast.promise(promise, {
            error: t('Something went wrong 😿'),
            loading: t('We are creating new project'),
            success: t('Voila! Project is here 🎉'),
        });

        const res = await promise;

        res.createTeam?.slug && router.team(res.createTeam.slug);
    };

    const isTeamTitleAvailable = Boolean(teamsData?.teams?.length === 0);

    return (
        <>
            <ModalHeader>
                <FormTitle>{t('Create new team')}</FormTitle>
            </ModalHeader>

            <ModalContent>
                <Form onSubmit={handleSubmit(createTeam)} submitHotkey={submitKeys}>
                    <StyledTitleContainer>
                        <FormInput
                            {...register('title')}
                            placeholder={t("Team's title")}
                            flat="bottom"
                            brick="right"
                            error={errorsResolver('title')}
                            onMouseEnter={() => setHoveredInput(true)}
                            onMouseLeave={() => setHoveredInput(false)}
                            onFocus={() => setFocusedInput(true)}
                            onBlur={() => setFocusedInput(false)}
                        />

                        {nullable(titleWatcher, () => (
                            <StyledProjectKeyContainer>
                                <StyledProjectKeyInputContainer
                                    brick="left"
                                    hovered={hoveredInput}
                                    focused={focusedInput}
                                ></StyledProjectKeyInputContainer>
                            </StyledProjectKeyContainer>
                        ))}
                    </StyledTitleContainer>

                    <FormTextarea
                        {...register('description')}
                        placeholder={t('And its description')}
                        flat="both"
                        error={errorsResolver('description')}
                    />

                    <FormActions flat="top">
                        <FormAction left inline></FormAction>
                        <FormAction right inline>
                            <Button view="primary" outline={!isValid} type="submit" text={t('Create team')} />
                        </FormAction>
                    </FormActions>
                </Form>

                <StyledFormBottom>
                    <Tip title={t('Pro tip!')} icon={<Icon type="bulbOn" size="s" color={star0} />}>
                        {t.rich('Press key to create the team', {
                            key: () => <Keyboard command enter />,
                        })}
                    </Tip>

                    <Link href={routes.help(locale, 'teams')}>
                        <Icon type="question" size="s" color={gray6} />
                    </Link>
                </StyledFormBottom>
            </ModalContent>
        </>
    );
};

export default TeamCreateForm;
