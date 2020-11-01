import React, { useState, useCallback } from 'react';
import { InputWithLabel, FormContainer, RadioButton } from '../app-layout';
import { useMobile, FormField } from '../utils';

interface Props {
    formFields: FormField[];
    onFormStructureChanged: (formFields: FormField[]) => void;
    back: () => void;
}
const AddNewField: React.FC<Props> = ({ formFields, onFormStructureChanged, back }) => {
    const [label, setLabel] = useState('');
    const [fieldType, setFieldType] = useState(FIELDS.type.items[0].value);
    const mobile = useMobile({
            action: "input",
            dataType: "form",
            form: {
                title: "Adding New Field",
                fields: Object.values(FIELDS)
            }
        });
    const onAddNew = () => {
        const newFormFields = createNewFormFields(formFields, label, fieldType);
        if (newFormFields) {
            onFormStructureChanged(newFormFields);
            back();
        }
    }

    mobile.setOnchange(({ field }) => {
        switch (field.id) {
            case FIELDS.type.id:
                if (!field.value || (!(field.value as string[]).length)) {
                    return -1;
                }
                setFieldType((field.value as string[])[0] as string);
                break;
            case FIELDS.name.id:
                setLabel(field.value as string);
                break;
            case FIELDS.add.id:
                onAddNew();
                break;
            case FIELDS.cancel.id:
                back();
        }
    });
    const setFormLabel = useCallback((value: string) => {
        setLabel(value);
        mobile.sendValue(FIELDS.name.id, value);
    }, [setLabel, mobile]);
    return (
        <FormContainer title="Adding New Field">
            <mobile.ConnectQR />
            {mobile.isConnected && (<>
                Enter the name of the new field
                <InputWithLabel label="Name of the field" id="newFieldLabel"
                    onChange={setFormLabel}
                    value={label} />

                <RadioButton name="fieldType" checked={fieldType === FIELDS.type.items[0].value} label="Single-line" onChange={() => {
                    setFieldType(FIELDS.type.items[0].value);
                    mobile.sendValue(FIELDS.type.id, FIELDS.type.items[0].value);
                }} />
                <RadioButton name="fieldType" checked={fieldType === FIELDS.type.items[1].value} label="Multi-line" onChange={() => {
                    setFieldType(FIELDS.type.items[1].value);
                    mobile.sendValue(FIELDS.type.id, FIELDS.type.items[1].value);
                }} />
            </>)}


        </FormContainer>
    );
};



const createNewFormFields = (formFields: FormField[], label: string, fieldType: string) => {
    label = label.trim();
    if (!label) {
        return null;
    }
    const nLines = fieldType === FIELDS.type.items[1].value ? 5 : 1;
    const id = label.replace(' ', "_").toLowerCase();
    for (let f of formFields) {
        if (f.id === id) {
            return null;
        }
    }
    return [...formFields, { id, label, value: '', nLines }];
};

const FIELDS = {
    name: {
        id: "nameOfNewField",
        type: "text",
        value: ""
    },
    type: {
        id: "multiLines",
        label: "Type",
        type: "list",
        selectType: "single",
        value: 'single-line',
        items: [
            { value: "single-line", label: "Single-line" },
            { value: "multi-line", label: "Multi-line" }
        ]
    },
    cancel: {
        id: "cancelAdd",
        label: "Cancel",
        type: "button",
        viewId: "row1"
    },
    add: {
        id: "addNew",
        label: "Add",
        type: "button",
        viewId: "row1"
    }
}

export default AddNewField;