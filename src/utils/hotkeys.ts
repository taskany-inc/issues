export const createFilterKeys = ['c f', 'с а'];
export const createProjectKeys = ['c p', 'с з'];
export const createGoalKeys = ['c g', 'с п'];
export const editGoalKeys = ['e', 'у'];
export const showHomeKeys = ['g h', 'п р'];
export const showProjectsKeys = ['g p', 'п з'];
export const showGoalsKeys = ['g g', 'п п'];
export const inviteUserKeys = ['c u', 'с г'];

export function isEventTargetInputOrTextArea(eventTarget: EventTarget | null) {
    if (eventTarget === null) return false;

    const eventTargetTagName = (eventTarget as HTMLElement).tagName.toLowerCase();
    return ['input', 'textarea'].includes(eventTargetTagName);
}

type HotkeyDeclaration = [string[], (e: KeyboardEvent) => void];
export const createHotkeys = (...args: HotkeyDeclaration[]): Record<string, (e: KeyboardEvent) => void> => {
    const declarations: Record<string, (e: KeyboardEvent) => void> = {};

    args.forEach((decl) => {
        decl[0].forEach((key) => {
            // https://github.com/jamiebuilds/tinykeys/issues/17#issuecomment-847867271
            // eslint-disable-next-line prefer-destructuring
            declarations[key] = (e: KeyboardEvent) => {
                if (!isEventTargetInputOrTextArea(e.target)) {
                    decl[1](e);
                }
            };
        });
    });

    return declarations;
};
