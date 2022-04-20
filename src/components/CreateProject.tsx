import { useSession } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import { Spacer, Text, Grid } from '@geist-ui/core';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';
import z from 'zod';
import useSWR from 'swr';

import { gql } from '../utils/gql';
import { Card } from './Card';
import { Icon } from './Icon';
import { Button } from './Button';
import { FormInput } from './FormInput';
import { FormTextarea } from './FormTextarea';
import { FormActions, FormActionRight, FormActionLeft } from './FormActions';
import { Form } from './Form';
import { Tip } from './Tip';
import { Keyboard } from './Keyboard';
import { accentIconColor } from '../design/@generated/themes';
import { UserDropdown } from './UserDropdown';
import { FlowDropdown } from './FlowDropdown';
import { UserPic } from './UserPic';
import { useEffect, useState } from 'react';
import { Flow, UserAnyKind } from '../../graphql/generated/genql';
import { createFetcher } from '../utils/createFetcher';

interface CreateProjectProps {
    card?: boolean;
    onCreate?: (slug?: string) => void;
}

const fetcher = createFetcher(() => ({
    flowRecommended:
        {
            id: true,
            title: true,
            states: {
                id: true,
                title: true,
            },
        },

}));

export const CreateProject: React.FC<CreateProjectProps> = ({ card, onCreate }) => {
    const { data: session } = useSession();
    const [owner, setOwner] = useState(session?.user as Partial<UserAnyKind>);
    const [flow, setFlow] = useState<Partial<Flow>>();
    const t = useTranslations('projects.new');
    const { data } = useSWR('flowRecommened', () => fetcher(session?.user));

    useEffect(() => {
        if (data?.flowRecommended) {
            setFlow(data?.flowRecommended[0]);
        }
    }, [data?.flowRecommended]);

    const schema = z.object({
        title: z
            .string({
                required_error: t("Project's title is required"),
                invalid_type_error: t("Project's title must be a string"),
            })
            .min(2, {
                message: t("Project's title must be longer than 2 symbols"),
            }),
        description: z.string().optional(),
    });

    type FormType = z.infer<typeof schema>;

    const {
        register,
        handleSubmit,
        formState: { errors, isValid, isSubmitted },
    } = useForm<FormType>({
        resolver: zodResolver(schema),
        mode: 'onChange',
        reValidateMode: 'onChange',
        shouldFocusError: true,
    });

    const createProject = async ({ title, description }: FormType) => {
        const promise = gql.mutation({
            createProject: [
                {
                    user: session!.user,
                    title,
                    description,
                    ownerId: owner.id!,
                    flowId: flow?.id!,
                },
                {
                    id: true,
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

        onCreate && onCreate(res.createProject?.slug);
    };

    const ownerButtonText = owner?.name || owner?.email || t('Assign');
    const flowButtonText = flow?.title || t('Flow');

    const formContent = (
        <Form onSubmit={handleSubmit(createProject)}>
            <Text h1>{t('Create new project')}</Text>

            <FormInput
                {...register('title')}
                error={isSubmitted ? errors.title : undefined}
                placeholder={t("Project's title")}
                autoFocus
                flat="bottom"
            />
            <FormTextarea
                {...register('description')}
                error={isSubmitted ? errors.description : undefined}
                flat="both"
                placeholder={t('And its description')}
            />
            <FormActions flat="top">
                <FormActionLeft>
                    <Grid.Container>
                        <UserDropdown
                            size="m"
                            view="outline"
                            text={ownerButtonText}
                            placeholder={t('Enter name or email')}
                            query={owner?.name || owner?.email}
                            userPic={<UserPic src={owner?.image} size={16} />}
                            onUserClick={(u) => setOwner(u)}
                        />
                        <Spacer w={0.5} />
                        <FlowDropdown
                            disabled
                            size="m"
                            view="outline"
                            text={flowButtonText}
                            placeholder={t('Flow or state title')}
                            query={flow?.title}
                            onClick={(f) => setFlow(f)}
                        />
                    </Grid.Container>
                </FormActionLeft>
                <FormActionRight>
                    <Button
                        size="m"
                        view="primary-outline"
                        type="submit"
                        disabled={!isValid}
                        text={t('Create project')}
                    />
                </FormActionRight>
            </FormActions>
            <Spacer />
        </Form>
    );

    return (
        <>
            {card ? <Card style={{ maxWidth: '800px' }}>{formContent}</Card> : formContent}
            <Tip title={t('Pro tip!')} icon={<Icon type="bulbOn" size="s" color={accentIconColor} />}>
                {t.rich('Press key to create the project', {
                    key: () => <Keyboard command enter />,
                })}
            </Tip>
        </>
    );
};
