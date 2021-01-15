import React, { useState, useCallback } from 'react';

import { useMobile, FormField } from '../mobile';
import type {InitData} from '../mobile';
import * as chromeExtension from '../chrome-extension';
import * as cache from './cache';
import {AppContainer,Form,Input,Label,Footer, DarkButton,Help,
    ConnectContainer,DomainField} from '../components';


import { FormContainer, DisplayInputCopyField, TextButton, FormFooter } from '../app-layout';
interface Props {
    domain: string;
    formFields: FormField[];
    setFormFields: (formFields: FormField[]) => void;
    back: () => void;
    manageForm: () => void;
};
const TransferFormData: React.FC<Props> = ({ domain, formFields, setFormFields, manageForm, back }) => {
    const [visibility, setVisibility] = useState(FIELDS.visibility.options[0]);
    const initData = () => {
        const initData = {
            form: {
                title: domain,
                domain: domain,
                label: domain,
                fields: [...Object.values(FIELDS), ...formFields]
            }
        }
        userWithDomainAsFormId(initData);
        return initData;
    };
    const mobile = useMobile(initData);

    const toggleVisibility = useCallback(() => {
        const vis = visibility === FIELDS.visibility.options[0] ? FIELDS.visibility.options[1] : FIELDS.visibility.options[0];
        setVisibility(vis);
        mobile.sendValue(FIELDS.visibility.id, vis.value);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [visibility, mobile.sendValue]);

    mobile.setOnchange(({field}) => {
        switch (field.id) {
            case FIELDS.visibility.id:
                toggleVisibility();
                break;
            case FIELDS.manage.id:
                manageForm();
                break;
            case FIELDS.back.id:
                back();
                break;
            default:
                for (const [index, formField] of formFields.entries()) {
                    if (formField.id === field.id) {
                        const changedFormFields = computeChangedFormFields(formFields, formField.id, field.value as string, index);
                        if (changedFormFields) {
                            setFormFields(changedFormFields);
                        }
                    }
                }
        }
    });
    const onCopied = () => {
        const key = cache.saveCacheFields(domain, formFields);
        if (key) {
            chromeExtension.sendKey(key);
        }
    };
    const onFieldChanged = (formFields: FormField[], formField: FormField, index: number, value: string) => {
        const changedFormFields = computeChangedFormFields(formFields, formField.id, value, index);
        if (changedFormFields) {
            setFormFields(changedFormFields);
            mobile.sendValue(formField.id as string, value, index);
        }
    }

    return (
        <AppContainer title="Form Data Transfer" domain={domain}>


            <FormContainer>
                {formFields.map((formField, index) => (<DisplayInputCopyField
                    field={formField}
                    key={formField.id}
                    onCopied={onCopied}
                    hideValue={visibility.value === 0} onChange={value => onFieldChanged(formFields, formField, index, value)} />))}
            </FormContainer>
            <FormFooter>
                <TextButton onClick={back} label="Back" />
                <TextButton onClick={toggleVisibility} label={visibility.label} />
                <TextButton onClick={manageForm} label="Manage" />
            </FormFooter>

        </AppContainer>
        );


};

const FIELDS = {
    back: {
        id: "backToHome",
        type: "button",
        label: "Back",
        viewId: "row1"
    },
    manage: {
        id: "manageForm",
        type: "button",
        label: "Manage",
        viewId: "row1"
    },
    visibility: {
        id: "fieldValueVisibility",
        type: 'button',
        viewId: "row1",
        options: [{ value: 0, label: 'Show' }, { value: 1, label: 'Hide' }],
        value: 0
    }

};

const computeChangedFormFields = (formFields: FormField[], fieldId: string | null | undefined, value: string, index: number) => {
    let fieldModified = false;
    const fields = formFields.map((f, ind) => {
        if (fieldId) {
            if (f.id === fieldId) {
                fieldModified = true;
                return { ...f, value };
            }
        }
        else {
            if (index >= 0 && index < formFields.length) {
                if (ind === index) {
                    fieldModified = true;
                    return { ...f, value };
                }
            }
        }
        return f;
    });
    if (fieldModified) {
        return fields;
    }
    return null;
}
export default TransferFormData;


const userWithDomainAsFormId = (initData: InitData) => {
    if (initData?.form?.domain && initData?.form?.fields?.length) {
        const textFields = initData.form.fields.filter(f => {
            if ((!f.type) || f.type === 'text') {
                if (f.nLines && f.nLines > 1) {
                    return false;
                }
                return true;
            }
            return false;
        });
        if (!textFields.length) {
            return null;
        }
        initData.form.id = `###${textFields[0].id}###@${initData.form.domain}`;
    }
};