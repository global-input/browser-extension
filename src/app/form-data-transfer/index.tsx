import React, { useCallback, useState } from 'react';

import * as storage from '../storage';

import { FormField } from '../mobile';

import CreateField from './CreateField';
import ManageForm from './ManageForm';
import TransferFormData from './TransferFormData';

export enum PAGES {
    TRANSFER_FORM_DATA,
    MANAGER_FORM,
    CREATE_FIELD
};

interface Props {
    domain: string;
    back: () => void;
}
const MainControl: React.FC<Props> = ({ domain, back }) => {
    const [page, setPage] = useState(PAGES.TRANSFER_FORM_DATA);
    const [formFields, setFormFields] = useState(() => buildFormFields(domain));

    const onFormStructureChanged = (formFields: FormField[]) => {
        setFormFields(formFields);
        storage.saveFormFields(domain, formFields);
    };
    const transferFormData = useCallback(() => setPage(PAGES.TRANSFER_FORM_DATA), []);
    const manageForm = useCallback(() => setPage(PAGES.MANAGER_FORM), []);
    const createField = useCallback(() => setPage(PAGES.CREATE_FIELD), []);

    switch (page) {
        case PAGES.TRANSFER_FORM_DATA:
            return (<TransferFormData domain={domain} formFields={formFields} setFormFields={setFormFields} back={back} manageForm={manageForm} />);
        case PAGES.MANAGER_FORM:
            return (<ManageForm formFields={formFields} onFormStructureChanged={onFormStructureChanged} back={transferFormData} createField={createField} />);
        case PAGES.CREATE_FIELD:
            return (<CreateField formFields={formFields} onFormStructureChanged={onFormStructureChanged} back={manageForm} />);
        default:
    }
    return null
};

const defaultFormFields = [{
    id: "username",
    label: "Username",
    value: ''
}, {
    id: "password",
    label: "Password",
    type: "secret",
    value: ''
}, {
    id: "note",
    label: "Note",
    nLines: 5, value: '',
}];

const buildFormFields = (domain: string) => {
    let fields = storage.loadSavedFormFields(domain);
    if (!fields) {
        fields = defaultFormFields;
    }
    return fields;
};



export default MainControl;