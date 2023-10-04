import { configureDomObjects } from 'dom-objects';

const DO = configureDomObjects({ attributeName: 'cy' });

export const header = DO('header');
export const headerMenu = header.add('menu');
export const headerMenuGoals = headerMenu.add('goals');
export const headerMenuProjects = headerMenu.add('projects');
export const headerMenuExplore = headerMenu.add('explore');
export const createFastButton = header.add('createFastButton');
export const createSelectButton = header.add('createSelectButton');
export const createProjectItem = header.add('createProjectItem');
export const createGoalItem = header.add('createGoalItem');

export const filtersPanel = DO('filtersPanel');
export const filtersPanelResetButton = filtersPanel.add('resetButton');

export const projectCreateForm = DO('projectCreateForm');
export const projectTitleInput = projectCreateForm.add('titleInput');
export const projectDescriptionInput = projectCreateForm.add('descriptionInput');
export const projectCancelButton = projectCreateForm.add('cancelButton');
export const projectSubmitButton = projectCreateForm.add('submitButton');
export const projectKeyPredictor = projectCreateForm.add('keyPredictor');
export const projectKeyPredictorInput = projectCreateForm.add('keyPredictorInput');
export const projectKeyPredictorHint = projectCreateForm.add('keyPredictorHint');
export const projectKeyPredictorError = projectCreateForm.add('keyPredictorError');

export const pageHeader = DO('pageHeader');
export const pageTitle = pageHeader.add('title');
export const pageDescription = pageHeader.add('description');
export const pageBreadcrumbs = pageHeader.add('breadcrumbs');
export const pageTabs = pageHeader.add('tabs');
export const pageActiveTabItem = pageTabs.add('activeTabItem');

export const projectListItem = DO('projectListItem');
export const projectListItemTitle = projectListItem.add('title');
export const projectGoalList = projectListItem.add('goals');
export const projectGoalListItem = projectListItem.add('goalItem');

export const createGoalInlineControl = DO('createGoalInlineControl');

export const goalCreateForm = DO('goalCreateForm');
export const goalTitleInput = goalCreateForm.add('title');
export const goalDescriptionInput = goalCreateForm.add('description');
export const goalProjectSelectControl = goalCreateForm.add('project');

export const projectSettingsContent = DO('projectSettingsContent');
export const projectSettingsTitleInput = projectSettingsContent.add('titleInput');
export const projectSettingsDescriptionInput = projectSettingsContent.add('descriptionInput');
export const projectSettingsParentMultiInput = projectSettingsContent.add('parentMultiInput');
export const projectSettingsParentMultiInputTrigger = projectSettingsContent.add('parentMultiInputTrigger');
export const projectSettingsParentMultiInputTagClean = projectSettingsContent.add('parentMultiInputTagClean');
export const projectSettingsSaveButton = projectSettingsContent.add('saveButton');
export const projectSettingsTitleError = projectSettingsContent.add('titleError');
export const projectSettingsDeleteProjectButton = projectSettingsContent.add('deleteProjectButton');
export const projectSettingsTransferProjectButton = projectSettingsContent.add('transferProjectButton');

export const projectSettingsDeleteForm = DO('projectSettingsDeleteForm');
export const projectSettingsDeleteProjectInput = projectSettingsDeleteForm.add('confirmDeleteInput');
export const projectSettingsConfirmDeleteProjectButton = projectSettingsDeleteForm.add('confirmDeleteProjectButton');
export const projectSettingsCancelDeleteProjectButton = projectSettingsDeleteForm.add('cancelDeleteProjectButton');

export const projectSettingsTransferForm = DO('projectSettingsTransferForm');
export const projectSettingsTransferProjectKeyInput = projectSettingsTransferForm.add('transferProjectKeyInput');
export const projectSettingsTransferProjectOwnerButton = projectSettingsTransferForm.add('transferProjectOwnerButton');
export const projectSettingsConfirmTransferProjectButton =
    projectSettingsTransferForm.add('confirmTransferProjectButton');
export const projectSettingsCancelTransferProjectButton =
    projectSettingsTransferForm.add('cancelTransferProjectButton');
export const goalPrioritySelectControl = goalCreateForm.add('priority');
export const goalOwnerSelectControl = goalCreateForm.add('owner');
export const goalActionCreateAndGo = goalCreateForm.add('create&go');
export const goalActionCreateOneMore = goalCreateForm.add('createOneMore');
export const goalActionCreateOnly = goalCreateForm.add('createOnly');
export const goalSaveButton = goalCreateForm.add('saveButton');
export const goalCancelButton = goalCreateForm.add('cancelButton');

export const issuePage = DO('issuePage');
export const issuePageHeader = issuePage.add('header');
export const issuePageHeaderTitle = issuePageHeader.add('title');
export const issuePageHeaderParent = issuePageHeader.add('parent');

export const combobox = DO('combobox');
export const comboboxItem = combobox.add('item');
export const usersCombobox = combobox.add('users');
export const usersCompboxInput = combobox.add('input');
export const projectsCombobox = combobox.add('projects');
export const projectsComboboxInput = combobox.add('input');
export const priorityCombobox = combobox.add('priority');
export const stateCombobox = combobox.add('state');
export const estimateCombobox = combobox.add('estimate');
export const tagsCombobox = combobox.add('tags');
export const tagsComboboxInput = combobox.add('input');
export const createActionToggle = combobox.add('actionToggle');
