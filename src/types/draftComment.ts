import { DraftGoalComment } from '../hooks/useLocalStorage';

export type DraftComment = DraftGoalComment[keyof DraftGoalComment];
