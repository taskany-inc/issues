import { test, expect } from '@jest/globals';

import { calculateDiffBetweenArrays } from './calculateDiffBetweenArrays';

const objectArray1 = Array.from({ length: 7 }, (_, index) => ({ id: index + 1 })); // [{ id: 1..7 }]
const objectArray2 = Array.from({ length: 3 }, (_, index) => ({ id: index + 3 })); // [{ id: 3..5 }]

test('diff between arrays with keyGetter', () => {
    expect(calculateDiffBetweenArrays(objectArray1, objectArray2)).toEqual([1, 2, 6, 7].map((id) => ({ id })));
    expect(calculateDiffBetweenArrays(objectArray2, objectArray1)).toEqual([]);
});
