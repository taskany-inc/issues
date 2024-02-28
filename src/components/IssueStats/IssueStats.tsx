import { nullable } from '@taskany/bricks';
import { CircleProgressBar, Link } from '@taskany/bricks/harmony';

import { DateType } from '../../types/date';
import { ActivityByIdReturnType } from '../../../trpc/inferredTypes';
import { CommentsCountBadge } from '../CommentsCountBadge';
import { PrivateDepsWarning } from '../PrivateDepsWarning/PrivateDepsWarning';
import { UserDropdown } from '../UserDropdown/UserDropdown';
import { EstimateDropdown } from '../EstimateDropdown/EstimateDropdown';
import { PriorityDropdown } from '../PriorityDropdown/PriorityDropdown';
import { Priority } from '../../types/priority';
import { getDateString } from '../../utils/dateTime';

import s from './IssueStats.module.css';

interface IssueStatsProps {
    comments: number;
    owner?: ActivityByIdReturnType | null;
    estimate?: Date | null;
    estimateType?: DateType | null;
    priority?: Priority | null;
    achivedCriteriaWeight?: number | null;
    hasPrivateDeps?: boolean;
    stateReadOnly?: boolean;
    onCommentsClick?: () => void;
}

const Separator: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <>
        <div className={s.Separator} />
        {children}
    </>
);

export const IssueStats: React.FC<IssueStatsProps> = ({
    owner,
    estimate,
    estimateType,
    priority,
    comments,
    achivedCriteriaWeight,
    hasPrivateDeps,
    stateReadOnly,
    onCommentsClick,
}) => {
    return (
        <div className={s.IssueStats}>
            {nullable(owner, (o) =>
                nullable(
                    stateReadOnly,
                    () => (
                        <Separator>
                            <UserDropdown value={o} label="Owner" view="default" readOnly />
                        </Separator>
                    ),
                    <UserDropdown value={o} label="Owner" view="default" readOnly />,
                ),
            )}

            {nullable(priority, (p) => (
                <Separator>
                    <PriorityDropdown label="Priority" value={p} view="default" readOnly />
                </Separator>
            ))}

            {nullable(estimate, (e) => (
                <Separator>
                    <EstimateDropdown
                        value={{ date: getDateString(e), type: estimateType ?? 'Strict' }}
                        label="Estimate"
                        view="default"
                        readOnly
                    />
                </Separator>
            ))}

            {achivedCriteriaWeight != null && (
                <Separator>
                    <div className={s.IssueComponentContainer}>
                        <CircleProgressBar value={achivedCriteriaWeight} size="l" />
                    </div>
                </Separator>
            )}

            {nullable(comments, () => (
                <Separator>
                    <div className={s.IssueComponentContainer}>
                        <Link view="secondary" onClick={onCommentsClick} className={s.CommentsCountLink}>
                            <CommentsCountBadge count={comments} />
                        </Link>
                    </div>
                </Separator>
            ))}

            {nullable(hasPrivateDeps, () => (
                <Separator>
                    <div className={s.IssueComponentContainer}>
                        <PrivateDepsWarning />
                    </div>
                </Separator>
            ))}
        </div>
    );
};
