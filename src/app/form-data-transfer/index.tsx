import React, { useState } from 'react';

import { FormField } from '../mobile';

import AddNewField from './AddNewField';
import DeleteFields from './DeleteFields';
import TransferFormData, { PAGES } from './TransferFormData';


interface Props {
    domain: string;
    back: () => void;
}
const MainControl: React.FC<Props> = ({ domain, back }) => {
    const [page, setPage] = useState(PAGES.TRANSFER_FORM_DATA);
    const [formFields, setFormFields] = useState(() => buildFormFields(domain));
    const onFormStructureChanged = (formFields: FormField[]) => {
        setFormFields(formFields);
        if (formFields.length) {
            const formsFieldsToSave = formFields.map(f => ({ ...f, value: undefined }));
            var fieldString = JSON.stringify(formsFieldsToSave);
            localStorage.setItem(getFormFieldsPrefix(domain), fieldString);
        }
        else {
            localStorage.removeItem(getFormFieldsPrefix(domain));
        }
    };
    const toTransfer = () => setPage(PAGES.TRANSFER_FORM_DATA);
    switch (page) {
        case PAGES.TRANSFER_FORM_DATA:
            return (<TransferFormData domain={domain} formFields={formFields} setFormFields={setFormFields} setPage={setPage} back={back} />);
        case PAGES.ADD_FIELD:
            return (<AddNewField formFields={formFields} onFormStructureChanged={onFormStructureChanged} back={toTransfer} />);
        case PAGES.DELETE_FIELDS:
            return (<DeleteFields formFields={formFields} onFormStructureChanged={onFormStructureChanged} back={toTransfer} />);
        default:
    }
    return null
};



const getFormFieldsPrefix = (domain: string) => {
    const domainPart = domain ? domain : 'default';
    return "extension.forms.fields." + domainPart;
};

const loadSavedFormFields = (domain: string) => {
    var fieldString = localStorage.getItem(getFormFieldsPrefix(domain));
    if (!fieldString) {
        return null;
    }
    try {
        const fields = JSON.parse(fieldString);
        if (fields && fields.length > 0) {
            return fields;
        }
    }
    catch (error) {
        console.error(error);
    }
    return null;
};

const defaultFormFields = [{
    id: "username",
    label: "Username",
    value: ''
}, {
    id: "password",
    label: "Password",
    value: ''
}, {
    id: "note",
    label: "Note",
    nLines: 5, value: '',
}];

const buildFormFields = (domain: string) => {
    let fields = loadSavedFormFields(domain);
    if (!fields) {
        fields = defaultFormFields;
    }
    return fields;
};



export default MainControl;