import { useState } from 'react';
import { useTranslations } from 'next-intl';
import toast from 'react-hot-toast';
import styled from 'styled-components';

import { Icon } from '@common/Icon';
import { Link } from '@common/Link';

import { gql } from '../utils/gql';
import { gapS, gray6, star0 } from '../design/@generated/themes';
import { Activity } from '../../graphql/@generated/genql';
import { routes, useRouter } from '../hooks/router';
import { usePageContext } from '../hooks/usePageContext';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { dispatchModalEvent, ModalEvent } from '../utils/dispatchModal';

import { Tip } from './Tip';
import { Keyboard } from './Keyboard';
import { GoalForm, GoalFormType } from './GoalForm';

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
    const [lastProjectCache, setLastProjectCache] = useLocalStorage('lastProjectCache');
    const [currentProjectCache] = useLocalStorage('currentProjectCache');
    const [recentProjectsCache, setRecentProjectsCache] = useLocalStorage('recentProjectsCache', {});
    const [busy, setBusy] = useState(false);

    const createGoal = async (form: GoalFormType) => {
        setBusy(true);

        const promise = gql.mutation({
            createGoal: [
                {
                    data: {
                        title: form.title,
                        description: form.description,
                        ownerId: form.owner.id,
                        parent: form.parent.id,
                        kind: form.parent.kind,
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
            if (newRecentProjectsCache[form.parent.id]) {
                newRecentProjectsCache[form.parent.id].rate += 1;
            } else {
                newRecentProjectsCache[form.parent.id] = {
                    rate: 1,
                    cache: form.parent,
                };
            }

            setRecentProjectsCache(newRecentProjectsCache);
            setLastProjectCache(form.parent);

            router.goal(res.createGoal.id);
            dispatchModalEvent(ModalEvent.GoalCreateModal)();
        }
    };

    return (
        <GoalForm
            busy={busy}
            i18nKeyset="goals.new"
            formTitle={t('Create new goal')}
            owner={{ id: user?.activityId, user } as Partial<Activity>}
            parent={currentProjectCache || lastProjectCache || undefined}
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
