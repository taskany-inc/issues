import { useTranslations } from 'next-intl';
import toast from 'react-hot-toast';
import styled from 'styled-components';

import { gql } from '../utils/gql';
import { gapS, gray6, star0 } from '../design/@generated/themes';
import { Activity } from '../../graphql/@generated/genql';
import { routes, useRouter } from '../hooks/router';
import { usePageContext } from '../hooks/usePageContext';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { LastOrCurrentProject, RecentProjectsCache } from '../types/localStorage';

import { Icon } from './Icon';
import { Tip } from './Tip';
import { Keyboard } from './Keyboard';
import { GoalForm, GoalFormType } from './GoalForm';
import { Link } from './Link';

const StyledFormBottom = styled.div`
    display: flex;
    align-items: flex-end;
    justify-content: space-between;

    padding: ${gapS} ${gapS} 0 ${gapS};
`;

const GoalCreateForm: React.FC = () => {
    const t = useTranslations('goals.new');
    const router = useRouter();
    const { locale, user } = usePageContext();
    const [lastProjectCache, setLastProjectCache] = useLocalStorage<LastOrCurrentProject>('lastProjectCache');
    const [currentProjectCache] = useLocalStorage<LastOrCurrentProject>('currentProjectCache');
    const [recentProjectsCache, setRecentProjectsCache] = useLocalStorage<RecentProjectsCache>(
        'recentProjectsCache',
        {},
    );

    const createGoal = async (form: GoalFormType) => {
        const promise = gql.mutation({
            createGoal: [
                {
                    data: {
                        title: form.title,
                        description: form.description,
                        ownerId: form.owner.id,
                        projectId: form.project.id,
                        stateId: form.state.id,
                        priority: form.priority,
                        tags: form.tags,
                        estimate: form.estimate,
                    },
                },
                {
                    id: true,
                },
            ],
        });

        toast.promise(promise, {
            error: t('Something went wrong 😿'),
            loading: t('We are creating new goal'),
            success: t('Voila! Goal is here 🎉'),
        });

        const res = await promise;

        if (res?.createGoal?.id) {
            const newRecentProjectsCache = { ...recentProjectsCache };
            if (newRecentProjectsCache[form.project.id]) {
                newRecentProjectsCache[form.project.id].rate += 1;
            } else {
                newRecentProjectsCache[form.project.id] = {
                    rate: 1,
                    cache: form.project,
                };
            }

            setRecentProjectsCache(newRecentProjectsCache);
            setLastProjectCache(form.project);

            router.goal(res.createGoal.id);
        }
    };

    return (
        <GoalForm
            i18nKeyset="goals.new"
            formTitle={t('Create new goal')}
            owner={{ id: user?.activityId, user } as Partial<Activity>}
            project={currentProjectCache || lastProjectCache || undefined}
            priority="Medium"
            onSumbit={createGoal}
        >
            <StyledFormBottom>
                <Tip title={t('Pro tip!')} icon={<Icon type="bulbOn" size="s" color={star0} />}>
                    {t.rich('Press key to create the goal', {
                        key: () => <Keyboard command enter />,
                    })}
                </Tip>

                <Link href={routes.help(locale, 'goals')}>
                    <Icon type="question" size="s" color={gray6} />
                </Link>
            </StyledFormBottom>
        </GoalForm>
    );
};

export default GoalCreateForm;
