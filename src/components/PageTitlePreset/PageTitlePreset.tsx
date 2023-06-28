import { useCallback } from 'react';

import { PageTitle } from '../PageTitle';

import { tr } from './PageTitlePreset.i18n';

interface PageTitlePresetProps {
    activityId: string;
    currentPresetActivityId?: string;
    currentPresetActivityUserName?: string | null;
    currentPresetTitle?: string;
    shadowPresetActivityId?: string;
    shadowPresetActivityUserName?: string | null;
    shadowPresetId?: string;
    shadowPresetTitle?: string;
    title?: string;
    setPreset: (id: string) => void;
}

export const PageTitlePreset: React.FC<PageTitlePresetProps> = ({
    activityId,
    currentPresetActivityId,
    currentPresetActivityUserName,
    currentPresetTitle,
    shadowPresetActivityId,
    shadowPresetActivityUserName,
    shadowPresetId,
    shadowPresetTitle,
    title,
    setPreset,
}) => {
    const titleDefault = <PageTitle title={title} />;
    const presetInfo =
        activityId !== currentPresetActivityId ? `${tr('created by')} ${currentPresetActivityUserName}` : undefined;
    const titlePreset = <PageTitle title={title} subtitle={currentPresetTitle} info={presetInfo} />;

    const shadowPresetInfo =
        activityId !== shadowPresetActivityId ? `${tr('created by')} ${shadowPresetActivityUserName}` : undefined;

    const onShadowPresetTitleClick = useCallback(() => {
        if (shadowPresetId) setPreset(shadowPresetId);
    }, [setPreset, shadowPresetId]);
    const titleShadow = (
        <PageTitle
            title={title}
            subtitle={shadowPresetTitle}
            info={shadowPresetInfo}
            onClick={onShadowPresetTitleClick}
        />
    );
    // eslint-disable-next-line no-nested-ternary
    return currentPresetTitle ? titlePreset : shadowPresetTitle ? titleShadow : titleDefault;
};
