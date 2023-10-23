export const exactUrl = (route: string) => `${Cypress.config('baseUrl')}${route}`;
export const getCommentIdQuery = (id: string, query = '') => `[id="comment-${id}"]${query}`;
