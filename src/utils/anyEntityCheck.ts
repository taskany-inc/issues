export const oneOf =
    <T>(...funcs: Array<(arg: T) => boolean>) =>
    (arg: T) =>
        funcs.some((f) => f(arg));

export const and =
    <T>(...funcs: Array<(arg: T) => boolean>) =>
    (arg: T) =>
        funcs.every((f) => f(arg));

export const inverse =
    <T>(func: (arg: T) => boolean) =>
    (arg: T) =>
        !func(arg);
