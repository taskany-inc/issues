import '../support';
import { createGoalInlineControl, filtersPanelResetButton, projectListItem } from '../../src/utils/domObjects';
import { keyPredictor } from '../../src/utils/keyPredictor';

const projectOne = 'Dashboard project';

describe('Dashboard', () => {
    before(() => {
        cy.task('db:create:project', {
            title: projectOne,
            key: keyPredictor(projectOne),
            ownerEmail: Cypress.env('ADMIN_EMAIL'),
        });
    });

    beforeEach(() => {
        cy.signInViaEmail();
    });

    it('filters are active by default', () => {
        cy.get('body')
            .should('exist')
            .then(($body) => {
                if ($body.find(projectListItem.query).length > 0) {
                    cy.get(projectListItem.query).filter(`:contains(${projectOne})`).should('not.exist');
                    return;
                }
                cy.get(projectListItem.query).should('not.exist');
            });

        cy.get(filtersPanelResetButton.query).should('exist').click().should('not.exist');

        cy.get(projectListItem.query)
            .filter(`:contains(${projectOne})`)
            .should('exist')
            .and('contain.text', projectOne)
            .get(createGoalInlineControl.query)
            .should('exist');
    });
});
