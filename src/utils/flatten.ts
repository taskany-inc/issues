export const flatten = (arr: any, result: any[] = []) => {
    // eslint-disable-next-line prefer-destructuring
    for (let i = 0, length = arr.length; i < length; i++) {
        const value = arr[i];
        if (Array.isArray(value)) {
            flatten(value, result);
        } else {
            result.push(value);
        }
    }

    return result.filter(Boolean);
};
