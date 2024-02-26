import React, { MouseEvent, useCallback, useRef, useState } from 'react';
import { Checkbox, CircleProgressBar, Table, TableCell, TableRow, Text, Popup, Badge } from '@taskany/bricks/harmony';
import { Spinner, nullable, useClickOutside } from '@taskany/bricks';
import classNames from 'classnames';

import { useGoalPreview } from '../GoalPreview/GoalPreviewProvider';
import { trpc } from '../../utils/trpcClient';
import { StateDot } from '../StateDot';

import classes from './NewGoalCriteria.module.css';
import { tr } from './NewGoalCriteria.i18n';

interface CriteriaProps {
    title: string;
    weight?: number;
    id: string;
    isDone: boolean;
}

interface GoalCriteriaProps extends CriteriaProps {
    goalId: string;
    shortId: string;
    stateColor?: number;
}

const SimpleCriteria: React.FC<Omit<CriteriaProps, 'id'>> = ({ title, isDone, weight }) => (
    <TableRow className={classes.NewGoalCriteriaTableRow}>
        <TableCell width={350}>
            <Checkbox
                className={classes.NewGoalCriteriaItemCheckbox}
                checked={isDone}
                readOnly
                view="rounded"
                label={
                    <Text
                        strike={isDone}
                        size="s"
                        weight="regular"
                        className={classNames({
                            [classes.NewGoalCriteriaItemTitleStrike]: isDone,
                        })}
                        lines={2}
                        ellipsis
                    >
                        {title}
                    </Text>
                }
            />
        </TableCell>
        <TableCell width="3ch" className={classes.NewGoalCriteriaWeightColumn}>
            {nullable((weight ?? 0) > 0, () => (
                <Text as="span" size="s" weight="regular" className={classes.NewGoalCriteriaItemWeight}>
                    {weight}
                </Text>
            ))}
        </TableCell>
    </TableRow>
);

const GoalCriteria: React.FC<Omit<GoalCriteriaProps, 'id'>> = ({ title, shortId, goalId, stateColor, weight }) => {
    const { setPreview } = useGoalPreview();

    const handleGoalCriteriaClick = useCallback(() => {
        setPreview(shortId, { title, id: goalId });
    }, [setPreview, title, shortId, goalId]);

    return (
        <TableRow className={classes.NewGoalCriteriaTableRow}>
            <TableCell width={350}>
                <Badge
                    iconLeft={
                        <StateDot
                            view="stroke"
                            hue={stateColor}
                            size="s"
                            className={classes.NewGoalCriteriaGoalBadgeState}
                        />
                    }
                    className={classes.NewGoalCriteriaGoalBadge}
                    onClick={handleGoalCriteriaClick}
                    text={title}
                />
            </TableCell>
            <TableCell width="3ch" className={classes.NewGoalCriteriaWeightColumn}>
                {nullable((weight ?? 0) > 0, () => (
                    <Text as="span" size="s" weight="regular" className={classes.NewGoalCriteriaItemWeight}>
                        {weight}
                    </Text>
                ))}
            </TableCell>
        </TableRow>
    );
};

function criteriaAsGoal(props: CriteriaProps | GoalCriteriaProps): props is GoalCriteriaProps {
    return 'goalId' in props;
}

export const Criteria: React.FC<CriteriaProps | GoalCriteriaProps> = (props) => {
    if (criteriaAsGoal(props)) {
        return (
            <GoalCriteria
                title={props.title}
                goalId={props.goalId}
                stateColor={props.stateColor}
                weight={props.weight}
                isDone={props.isDone}
                shortId={props.shortId}
            />
        );
    }

    return <SimpleCriteria title={props.title} isDone={props.isDone} weight={props.weight} />;
};

interface CriteriaListProps {
    list?: Array<CriteriaProps | GoalCriteriaProps>;
}

export const CriteriaList: React.FC<CriteriaListProps> = ({ list = [] }) => {
    return (
        <Table className={classes.NewGoalCriteriaTable}>
            {list.map((criteria) => (
                <Criteria key={criteria.id} {...criteria} />
            ))}
        </Table>
    );
};

interface GoalCriteriaPreviewProps {
    achievedWeight: number;
    goalId: string;
}

export const GoalCriteriaPreview: React.FC<GoalCriteriaPreviewProps> = ({ achievedWeight, goalId }) => {
    const [popupVisible, setPopupVisible] = useState(false);
    const triggerRef = useRef<HTMLSpanElement>(null);
    const wrapperRef = useRef<HTMLDivElement>(null);

    const { data, status } = trpc.goal.getGoalCriteriaList.useQuery({ id: goalId }, { enabled: popupVisible });

    useClickOutside(wrapperRef, ({ target }) => {
        if (!popupVisible) {
            return;
        }

        if (target instanceof HTMLElement) {
            if (!wrapperRef.current?.contains(target)) {
                setPopupVisible(false);
            }
        }
    });

    const handleOpen = useCallback(
        (e: MouseEvent<HTMLSpanElement>) => {
            // block following a link that hangs on the entire table row
            e.preventDefault();

            // block opening GoalPreview
            e.stopPropagation();

            if (!popupVisible) {
                setPopupVisible(true);
            }
        },
        [popupVisible],
    );

    return (
        <>
            <span ref={triggerRef} className={classes.NewGoalCriteriaTrigger} onClick={handleOpen}>
                <CircleProgressBar value={achievedWeight} />
            </span>
            <Popup
                reference={triggerRef}
                visible={popupVisible}
                placement="bottom-end"
                offset={[10, 10]}
                arrow={false}
                onClickCapture={() => setPopupVisible(false)}
                onClick={(e) => {
                    // block opening GoalPreview
                    e.stopPropagation();
                }}
            >
                <div className={classes.NewGoalCriteria} ref={wrapperRef}>
                    <Text className={classes.NewGoalCriteriaTitle} as="h4">
                        {tr('Achievement criteria')}
                    </Text>
                    {nullable(status === 'success', () => (
                        <CriteriaList
                            list={data?.map((criteria) => {
                                if (criteria.criteriaGoal) {
                                    return {
                                        id: criteria.id,
                                        goalId: criteria.criteriaGoal.id,
                                        stateColor: criteria.criteriaGoal.state?.hue,
                                        title: criteria.criteriaGoal.title,
                                        shortId: criteria.criteriaGoal._shortId,
                                        isDone: criteria.isDone,
                                        weight: criteria.weight,
                                    };
                                }

                                return {
                                    title: criteria.title,
                                    id: criteria.id,
                                    isDone: criteria.isDone,
                                    weight: criteria.weight,
                                };
                            })}
                        />
                    ))}
                    {nullable(status === 'loading', () => (
                        <div className={classes.NewGoalCriteriaLoader}>
                            <Badge iconLeft={<Spinner size="s" />} text={tr('Loading ...')} />
                        </div>
                    ))}
                </div>
            </Popup>
        </>
    );
};
