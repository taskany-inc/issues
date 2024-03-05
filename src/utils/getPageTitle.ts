export const getPageTitle = ({
    title = '',
    currentPresetTitle,
    shadowPresetTitle,
}: {
    title?: string;
    shadowPresetTitle?: string;
    currentPresetTitle?: string;
}): string => {
    if (currentPresetTitle) {
        return `${title}: ${currentPresetTitle}`;
    }

    if (shadowPresetTitle) {
        return `${title}: ${shadowPresetTitle}`;
    }

    return title;
};
