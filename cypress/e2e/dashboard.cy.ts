import '../support';
import { routes } from '../../src/hooks/router';
import { createGoalInlineControl, filtersPanelResetButton, projectListItem } from '../../src/utils/domObjects';

const projectOne = 'Dashboard project';

describe('Dashboard', () => {
    before(() => {
        cy.signInViaEmail();
        cy.createProject({ title: projectOne });
        cy.clearCookies();
        cy.visit(routes.signIn());
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
            .next(createGoalInlineControl.query)
            .should('exist');
    });
});
