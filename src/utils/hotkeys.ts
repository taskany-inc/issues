export const createProjectKeys = ['c p', 'с з'];
export const createGoalKeys = ['c g', 'с п'];
export const showHomeKeys = ['g h', 'п р'];
export const showProjectsKeys = ['g p', 'п з'];
export const showGoalsKeys = ['g g', 'п п'];

type HotkeyDeclaration = [string[], () => void];
export const createHotkeys = (...args: HotkeyDeclaration[]): Record<string, () => void> => {
    const declarations: Record<string, () => void> = {};

    args.forEach(decl => {
        decl[0].forEach(key => {
            declarations[key] = decl[1];
        });
    });

    return declarations;
}
