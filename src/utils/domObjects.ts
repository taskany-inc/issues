import { configureDomObjects } from 'dom-objects';

const DO = configureDomObjects({ attributeName: 'cy' });

export const header = DO('header');
export const headerMenu = header.add('menu');
export const headerMenuGoals = headerMenu.add('goals');
export const headerMenuExplore = headerMenu.add('explore');
export const createFastButton = header.add('createFastButton');
export const createSelectButton = header.add('createSelectButton');
export const createProjectItem = header.add('createProjectItem');
export const createGoalItem = header.add('createGoalItem');
export const createPersonalGoalItem = header.add('createPersonalGoalItem');

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

export const goalForm = DO('goalForm');
export const goalTitleInput = goalForm.add('title');
export const goalDescriptionInput = goalForm.add('description');
export const goalProjectSelectControl = goalForm.add('project');
export const goalPrioritySelectControl = goalForm.add('priority');
export const goalOwnerSelectControl = goalForm.add('owner');
export const goalActionCreateAndGo = goalForm.add('create&go');
export const goalActionCreateOneMore = goalForm.add('createOneMore');
export const goalActionCreateOnly = goalForm.add('createOnly');
export const goalSaveButton = goalForm.add('saveButton');
export const goalCancelButton = goalForm.add('cancelButton');
export const goalUpdateButton = goalForm.add('updateButton');

export const goalDeleteForm = DO('goalDeleteForm');
export const goalDeleteShortIdInput = goalDeleteForm.add('shortIdInput');
export const goalDeleteSubmitButton = goalDeleteForm.add('goalDeleteForm');

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

export const goalPage = DO('goalPage');
export const goalPageHeader = goalPage.add('header');
export const goalPageHeaderTitle = goalPageHeader.add('title');
export const goalPageHeaderParent = goalPageHeader.add('parent');
export const goalPageEditButton = goalPage.add('edit');
export const goalPageDeleteButton = goalPage.add('delete');

export const combobox = DO('combobox');
export const comboboxItem = combobox.add('item');
export const comboboxInput = combobox.add('input');
export const usersCombobox = combobox.add('users');
export const projectsCombobox = combobox.add('projects');
export const priorityCombobox = combobox.add('priority');
export const stateCombobox = combobox.add('state');
export const estimateCombobox = combobox.add('estimate');
export const tagsCombobox = combobox.add('tags');
export const createActionToggle = combobox.add('actionToggle');

export const comment = DO('comment');
export const commentDescription = comment.add('description');
export const commentDropdown = comment.add('dropdown');
export const commentDropdownDelete = comment.add('delete');
export const commentDropdownEdit = comment.add('edit');

export const commentForm = DO('commentForm');
export const commentFormDescription = commentForm.add('description', 'textarea');
export const commentFormSubmitButton = commentForm.add('submitButton');

export const userSettings = DO('userSettings');
export const userSettingsLogoutButton = userSettings.add('logoutButton');
