export const getPageTitle = ({ title = '', presetTitle }: { title?: string; presetTitle?: string }): string => {
    if (presetTitle) {
        return `${title}: ${presetTitle}`;
    }

    return title;
};
