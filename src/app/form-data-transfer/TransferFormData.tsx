import React, { useState, useCallback } from 'react';

import { useMobile,FormField,saveCacheFields } from '../utils';
import {chromeExtension} from '../utils';

import {ControlLayout, FormContainer, DisplayInputCopyField, TextButton } from '../app-layout';

export enum PAGES {
    TRANSFER_FORM_DATA,
    ADD_FIELD,
    DELETE_FIELDS,
    EDIT_FORM_PROPERTIES
};


const computerFormId = (domain: string, fields: FormField[]) => {
    const id = fields.length ? '###' + fields[0].id + '###' : 'credential';
    return id + '@' + domain;
}

const FIELDS = {
    visibility: {
        id: "fieldValueVisibility",
        type: 'button',
        viewId: "row0",
        options: [{ value: 0, label: 'Show' }, { value: 1, label: 'Hide' }],
        value: 0
    },
    add: {
        id: "addNewField",
        type: "button",
        label: "Add New Field",
        viewId: "row1"
    },
    delete: {
        id: "deleteFields",
        type: "button",
        label: "Delete Fields",
        viewId: "row1"
    },
    back: {
        id: "backToHome",
        type: "button",
        label: "Back",
        viewId: "row2"
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



interface Props {
    domain: string;
    formFields: FormField[];
    setFormFields: (formFields: FormField[]) => void;
    setPage: (page: PAGES) => void;
    back: () => void;
};
const TransferFormData: React.FC<Props> = ({ domain, formFields, setFormFields, setPage, back }) => {
    const [visibility, setVisibility] = useState(FIELDS.visibility.options[0]);
    const mobile = useMobile(() => {
        const id = computerFormId(domain, formFields);
        return {
                form: {
                    id,
                    title: domain,
                    label: "web",
                    domain: domain,
                    fields: [...Object.values(FIELDS),
                    ...formFields]
                }
            };
        });

    const toggleVisibility = useCallback(() => {
        const vis = visibility === FIELDS.visibility.options[0] ? FIELDS.visibility.options[1] : FIELDS.visibility.options[0];
        setVisibility(vis);
        mobile.sendValue(FIELDS.visibility.id, vis.value);
    }, [visibility, mobile]);



    mobile.setOnchange(({ field }) => {
        switch (field.id) {
            case FIELDS.visibility.id:
                toggleVisibility();
                break;
            case FIELDS.add.id:
                setPage(PAGES.ADD_FIELD);
                break;
            case FIELDS.delete.id:
                setPage(PAGES.DELETE_FIELDS);
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
        const key=saveCacheFields(domain,formFields);
        if(key){
            chromeExtension.sendKey(key);
        }
    };

    return (
    <ControlLayout title="Form Data Transfer" domain={domain} mobile={mobile}>
<FormContainer>
            {formFields.map((formField, index) => (<DisplayInputCopyField
                field={formField}
                key={formField.id}
                onCopied={onCopied}
                hideValue={visibility.value === 0} onChange={value => {
                    const changedFormFields = computeChangedFormFields(formFields, formField.id, value, index);
                    if (changedFormFields) {
                        setFormFields(changedFormFields);
                        mobile.sendValue(formField.id as string, value, index);
                    }
                }
                } />))}
        <TextButton onClick={toggleVisibility} label={visibility.label} />
    </FormContainer>
        </ControlLayout>);


};

export default TransferFormData;