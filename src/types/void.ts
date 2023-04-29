export type Void<A> = (a: A) => void;
export type Noop = () => void;
export type Nullish<T> = { [P in keyof T]?: T[P] | undefined | null };
