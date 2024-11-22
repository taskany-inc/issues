import '../support';
import {
    appliedFiltersPanelEstimate,
    createGoalInlineControl,
    estimateQuarterTrigger,
    filtersPanelResetButton,
    participants,
    projectListItem,
    watch,
    sortPanel,
    sortPanelDropdownTrigger,
    sortPanelEmptyProjectsCheckbox,
} from '../../src/utils/domObjects';
import { keyPredictor } from '../../src/utils/keyPredictor';
import { getTranslation } from '../support/lang';
import { routes } from '../../src/hooks/router';

const projectOne = 'Dashboard project';
const testUser = {
    name: 'Test user 1',
    email: 'user1@taskany.org',
    password: 'password',
    provider: 'provider1',
};

describe('Dashboard', () => {
    before(() => {
        cy.task('db:create:project', {
            title: projectOne,
            key: keyPredictor(projectOne),
            ownerEmail: Cypress.env('ADMIN_EMAIL'),
        }).then((res) => Cypress.env(projectOne, res));
    });

    beforeEach(() => {
        cy.interceptWhatsNew();
        cy.signInViaEmail();
        cy.wait('@whatsnew.check');
    });

    it('filters are active by default', () => {
        cy.get('body').should('exist');

        cy.get(projectListItem.query).filter(`:contains(${projectOne})`).should('exist');

        cy.get(filtersPanelResetButton.query).should('exist').click().should('not.exist');

        cy.get(projectListItem.query)
            .filter(`:contains(${projectOne})`)
            .should('exist')
            .and('contain.text', projectOne)
            .get(createGoalInlineControl.query)
            .should('exist');
    });

    after(() => {
        cy.task('db:remove:project', {
            id: Cypress.env(projectOne),
        });
    });
});

describe('User dashboard', () => {
    before(() => {
        cy.task('db:create:user', testUser).then((u) => {
            Cypress.env('testUser', u);
        });
        cy.task('db:create:project', {
            title: projectOne,
            key: keyPredictor(projectOne),
            ownerEmail: Cypress.env('ADMIN_EMAIL'),
        }).then((res) => Cypress.env(projectOne, res));
        cy.loadLangFile();
    });

    beforeEach(() => {
        cy.interceptWhatsNew();
        cy.signInViaEmail(testUser);
        cy.wait('@whatsnew.check');
    });

    describe('User have own project', () => {
        const userProjectTitle = `Project for ${testUser.name}`;

        before(() => {
            cy.task('db:create:project', {
                title: userProjectTitle,
                key: keyPredictor(userProjectTitle),
                ownerEmail: testUser.email,
            }).then((res) => Cypress.env('testUserProject', res));
        });

        it('user see own project without goals with applied filters', () => {
            cy.get(projectListItem.query).should('exist').and('include.text', userProjectTitle);
        });

        it("user don't see own project without goals with empty projects filters", () => {
            cy.get(projectListItem.query).should('exist');

            cy.get(sortPanel.query).should('not.exist');
            cy.get(sortPanelDropdownTrigger.query).should('exist').click();
            cy.get(sortPanel.query).should('exist');
            cy.get(sortPanelEmptyProjectsCheckbox.query)
                .should('exist')
                .and('be.checked')
                .click()
                .should('not.checked');

            cy.get(projectListItem.query).should('not.exist');
        });

        it('user see own project without goals with clear filters', () => {
            cy.get(filtersPanelResetButton.query).should('exist').click().should('not.exist');

            cy.get(projectListItem.query).should('exist').and('include.text', userProjectTitle);
        });

        it("user can create goal from projects's list", () => {
            cy.get(projectListItem.query).find(createGoalInlineControl.query).and('not.include.text');
        });

        after(() => {
            cy.task('db:remove:project', { id: Cypress.env('testUserProject') });
        });
    });

    describe('User have goal as owner in not own project', () => {
        const userGoalTitle = `Goal for ${testUser.name}`;

        before(() => {
            cy.task('db:create:goal', {
                title: userGoalTitle,
                projectId: keyPredictor(projectOne),
                ownerEmail: testUser.email,
            }).then((g) => Cypress.env('createdGoal', g));
        });

        it('User can see self goal which assigned in not own project', () => {
            cy.get(projectListItem.query)
                .filter(`:contains(${userGoalTitle})`)
                .should('exist')
                .and('contain.text', userGoalTitle)
                .and('contain.text', Cypress.env('defaultPriority'))
                .and('contain.text', 'Draft')
                .and('contain.text', testUser.name);
        });

        it('User cannot see self goal which assigned in not own project if filter contains next quarter', () => {
            cy.hideEmptyProjectOnGoalLists();
            cy.get(appliedFiltersPanelEstimate.query).click();
            cy.get(estimateQuarterTrigger.query).children().find(':button:contains(@next)').click();
            cy.get(appliedFiltersPanelEstimate.query).focus().realPress('{esc}');

            cy.location('search').should('include', `estimate=${encodeURIComponent('@next')}`);
            cy.get(projectListItem.query).should('not.exist');
        });

        after(() => {
            cy.task('db:remove:goal', Cypress.env('createdGoal'));
        });
    });

    describe('user participates in the project', () => {
        before(() => {
            cy.task('db:participate:project', {
                projectId: Cypress.env(projectOne) ?? 'DSHBRDPRJC',
                userId: Cypress.env('testUser')?.activityId || 'clxu5e9al0002p3k5cpoqqton',
            });
        });

        after(() => {
            cy.task('db:dropParticipate:project', {
                projectId: Cypress.env(projectOne),
                userId: Cypress.env('testUser').activityId,
            });
        });

        it('User can see own watching project', () => {
            cy.get(filtersPanelResetButton.query).should('exist').click().should('not.exist');
            cy.get(projectListItem.query)
                .should('exist')
                .get(participants.query)
                .should('exist')
                .children()
                .should('have.length.gte', 1)
                .children()
                .first()
                .children()
                .getTippy(testUser.name);
        });
    });

    describe('user participates in the goal of another project', () => {
        before(() => {
            cy.task('db:create:goal', {
                projectId: Cypress.env(projectOne),
                ownerEmail: Cypress.env('ADMIN_EMAIL'),
                title: 'Participate goal',
            }).then((goal: { id: string }) => {
                cy.task('db:participate:goal', {
                    goalId: goal.id,
                    userId: Cypress.env('testUser').activityId,
                });

                Cypress.env('participateGoal', goal);
            });
        });

        it('User can see own participate goal', () => {
            cy.get(filtersPanelResetButton.query).should('exist').click().should('not.exist');
            cy.get(projectListItem.query)
                .should('exist')
                .find('a:contains(Participate goal)')
                .should('exist')
                .children()
                .find(participants.query)
                .should('exist')
                .children()
                .first()
                .children()
                .first()
                .children()
                .getTippy(testUser.name);
        });

        after(() => {
            cy.task('db:dropParticipate:goal', {
                goalId: Cypress.env('participateGoal').id,
                userId: Cypress.env('testUser').activityId,
            });

            cy.task('db:remove:goal', {
                id: Cypress.env('participateGoal').id,
            });
        });
    });

    describe('user watches for project', () => {
        before(() => {
            cy.task('db:watch:project', {
                projectId: Cypress.env(projectOne),
                userId: Cypress.env('testUser').activityId,
            });
        });

        after(() => {
            cy.task('db:unwatch:project', {
                projectId: Cypress.env(projectOne),
                userId: Cypress.env('testUser').activityId,
            });
        });

        it('User can see own watching project', () => {
            cy.get(filtersPanelResetButton.query).should('exist').click().should('not.exist');
            cy.get(projectListItem.query).should('exist').get(watch.query).should('exist');
        });
    });

    describe('user watches for goal of another project', () => {
        before(() => {
            cy.task('db:create:goal', {
                projectId: Cypress.env(projectOne),
                ownerEmail: Cypress.env('ADMIN_EMAIL'),
                title: 'Watching goal',
            }).then((goal: { id: string }) => {
                cy.task('db:watch:goal', {
                    goalId: goal.id,
                    userId: Cypress.env('testUser').activityId,
                });

                Cypress.env('watchingGoal', goal);
            });
        });

        it('User can see own watching goal', () => {
            const translates = getTranslation({
                WatchButton: ['Watching'],
            });
            cy.get(filtersPanelResetButton.query).should('exist').click().should('not.exist');
            cy.get(projectListItem.query).should('exist').find(':contains(Watching goal)').should('exist');

            cy.visit(routes.goal(Cypress.env('watchingGoal')._shortId));
            cy.location('pathname').should('include', Cypress.env('watchingGoal')._shortId);
            cy.get(watch.query).should('include.text', translates.WatchButton.Watching());
        });

        after(() => {
            cy.task('db:unwatch:goal', {
                goalId: Cypress.env('watchingGoal').id,
                userId: Cypress.env('testUser').activityId,
            });

            cy.task('db:remove:goal', {
                id: Cypress.env('watchingGoal').id,
            });
        });
    });

    after(() => {
        cy.task('db:remove:project', { id: Cypress.env(projectOne) });
        cy.task('db:remove:user', Cypress.env('testUser'));
    });
});
