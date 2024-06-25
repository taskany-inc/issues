import '../support';
import { keyPredictor } from '../../src/utils/keyPredictor';
import { routes } from '../../src/hooks/router';
import {
    comment as commentDO,
    commentDescription as commentDescriptionDO,
    commentDropdown,
    commentDropdownDelete,
    commentDropdownEdit,
} from '../../src/utils/domObjects';
import { getCommentIdQuery } from '../helpers';
import { CommentCreateReturnType, GoalCreateReturnType } from '../../trpc/inferredTypes';

const userEmail = 'user@taskany.org';
const userPassword = 'taskany';

const goalTitle = 'Goal with comments';
const goalDescription = 'Goal with comments description';
const projectTitle = 'Test Comments Project';
const projectKey = keyPredictor(projectTitle);

const commentDescription = 'Base comment text';

before(() => {
    cy.task('db:create:project', {
        title: projectTitle,
        key: projectKey,
        ownerEmail: userEmail,
    }).then((p: string) => {
        Cypress.env('stubProject', p);
    });
});

after(() => {
    cy.task('db:remove:project', { id: Cypress.env('stubProject') });
});

describe('Comments', () => {
    describe('access', () => {
        beforeEach(() => {
            cy.signInViaEmail();
            cy.interceptEditor();

            cy.createGoal(projectTitle, {
                title: goalTitle,
                description: goalDescription,
            }).then((goal) => {
                cy.visit(routes.goal(goal._shortId));

                cy.waitEditor();

                cy.createComment({ description: commentDescription });
            });
        });

        afterEach(() => {
            const createdGoal = Cypress.env('createdGoal');

            if (createdGoal) {
                cy.task('db:remove:goal', createdGoal);
            }
        });

        it('User can create, edit and delete own comments', () => {
            cy.get<GoalCreateReturnType>('@createdGoal').then((goal) => cy.visit(routes.goal(goal._shortId)));

            cy.get<CommentCreateReturnType>('@createdComment').then((comment) => {
                cy.get(getCommentIdQuery(comment.id, commentDO.query)).should('exist').should('be.visible');
                cy.get(getCommentIdQuery(comment.id, commentDescriptionDO.query)).contains(commentDescription);

                const updatedCommentDescription = `${commentDescription}__updated`;

                cy.waitEditor();

                cy.updateComment({
                    id: comment.id,
                    description: updatedCommentDescription,
                });

                cy.get(getCommentIdQuery(comment.id, commentDescriptionDO.query)).contains(updatedCommentDescription);

                cy.deleteComment(comment.id);

                cy.get(getCommentIdQuery(comment.id, commentDO.query)).should('not.exist');
            });
        });

        it('User can`t modify other comments', () => {
            cy.logout();
            cy.signInViaEmail({ email: userEmail, password: userPassword });

            cy.get<GoalCreateReturnType>('@createdGoal').then((goal) => {
                cy.visit(routes.goal(goal._shortId));
            });

            cy.get<CommentCreateReturnType>('@createdComment').then((comment) => {
                cy.get(getCommentIdQuery(comment.id, commentDropdown.query)).click();
                cy.get(getCommentIdQuery(comment.id, commentDropdownEdit.query)).should('not.exist');
                cy.get(getCommentIdQuery(comment.id, commentDropdownDelete.query)).should('not.exist');
            });
        });
    });
});
