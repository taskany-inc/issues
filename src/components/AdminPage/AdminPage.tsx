import { tr } from './AdminPage.i18n';

export const AdminPage = () => (
    <div>
        <h1>{tr('This page is protected AdminPanel')}</h1>
        <p>{tr('Only admin users can see this page.')}</p>
    </div>
);
