export function errorsProvider<T>(
    errors: Partial<Record<keyof T, { message?: string } | undefined>>,
    isSubmitted: boolean,
) {
    return (field: keyof T) => (isSubmitted && errors[field]?.message ? errors[field] : undefined);
}
