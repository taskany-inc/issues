import { randomHex } from './randomHex';

test('returns ready to use colors', () => {
    expect(randomHex(['#121212', '#fff'])).not.toBeNull();
});
