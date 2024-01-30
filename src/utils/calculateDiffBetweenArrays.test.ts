import test from 'node:test';
import assert from 'node:assert';

import { calculateDiffBetweenArrays } from './calculateDiffBetweenArrays';

const objectArray1 = Array.from({ length: 7 }, (_, index) => ({ id: index + 1 })); // [{ id: 1..7 }]
const objectArray2 = Array.from({ length: 3 }, (_, index) => ({ id: index + 3 })); // [{ id: 3..5 }]

test('diff between arrays with keyGetter', () => {
    assert.deepStrictEqual(
        calculateDiffBetweenArrays(objectArray1, objectArray2),
        [1, 2, 6, 7].map((id) => ({ id })),
    );
    assert.deepStrictEqual(calculateDiffBetweenArrays(objectArray2, objectArray1), []);
});
