import { nullable } from '@taskany/bricks';
import { Badge, CircleProgressBar, Link } from '@taskany/bricks/harmony';
import { IconChatTypingAltOutline } from '@taskany/icons';

import { DateType } from '../../types/date';
import { ActivityByIdReturnType } from '../../../trpc/inferredTypes';
import { PrivateDepsWarning } from '../PrivateDepsWarning/PrivateDepsWarning';
import { UserDropdown } from '../UserDropdown/UserDropdown';
import { EstimateDropdown, getEstimateDropdownValueFromDate } from '../EstimateDropdown/EstimateDropdown';
import { PriorityDropdown } from '../PriorityDropdown/PriorityDropdown';
import { Priority } from '../../types/priority';
import { safeUserData } from '../../utils/getUserName';

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
            {nullable(owner, ({ id, ...rest }) => {
                const owner = { id, user: safeUserData(rest) };
                return nullable(
                    stateReadOnly,
                    () => (
                        <Separator>
                            <UserDropdown mode="single" value={owner} label="Owner" view="default" readOnly />
                        </Separator>
                    ),
                    <UserDropdown mode="single" value={owner} label="Owner" view="default" readOnly />,
                );
            })}

            {nullable(priority, (p) => (
                <Separator>
                    <PriorityDropdown mode="single" label="Priority" value={p} view="default" readOnly />
                </Separator>
            ))}

            {nullable(estimate, (e) => (
                <Separator>
                    <EstimateDropdown
                        value={getEstimateDropdownValueFromDate(e, estimateType)}
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
                            <Badge iconLeft={<IconChatTypingAltOutline size="xs" />} text={comments} />
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
