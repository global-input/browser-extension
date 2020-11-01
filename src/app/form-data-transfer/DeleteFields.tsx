import React, { useState } from 'react';
import { FormContainer, CheckboxButton } from '../app-layout';
import { useMobile,FormField } from '../utils';
interface Props {
    formFields: FormField[];
    onFormStructureChanged: (formFields: FormField[]) => void;
    back: () => void;
}

const DeleteFields: React.FC<Props> = ({ formFields, onFormStructureChanged, back }) => {
    const [items, setItems] = useState(() => createSelectableItems(formFields));
    const mobile = useMobile({
            action: "input",
            dataType: "form",
            form: {
                title: "Deleting Fields",
                fields: [{ ...FIELDS.select, items }, FIELDS.cancel, FIELDS.delete]
            }
        });
    mobile.setOnchange(({ field }) => {
        switch (field.id) {
            case FIELDS.select.id:
                const newItems = updateSelection(items, field.value as string[]);
                setItems(newItems);
                break;
            case FIELDS.cancel.id:
                back();
                break;
            case FIELDS.delete.id:
                const newFormFields = deleteFormFields(formFields, items);
                if (newFormFields) {
                    onFormStructureChanged(newFormFields);
                    back();
                }
                break;
            default:



        }
    });

    const toggleSelected = (itm: Item) => {
        const values: string[] = [];

        const newItems = items.map((f) => {
            if (f === itm) {
                f = { ...f, selected: !f.selected };
            }
            if (f.selected) {
                values.push(f.value);
            }
            return f;
        });
        setItems(newItems);

        mobile.sendValue(FIELDS.select.id, values);
    }

    return (
        <FormContainer title="Deleting Fields">
            <mobile.ConnectQR />
            {mobile.isConnected && (<>
                {items.map(item => (
                    <CheckboxButton
                        label={item.label as string}
                        checked={item.selected} onChange={() => toggleSelected(item)}
                        key={item.value as string} />)
                )}
            </>)}
        </FormContainer>
    )
};


interface Item {
    label: string;
    value: string;
    selected: boolean;
}

const FIELDS = {
    select: {
        id: "fieldsToDelete",
        label: "Select",
        type: "list",
        selectType: "multiple",
        value: null,
        items: ["dd", "dd"]
    },
    cancel: {
        id: "cancelDelete",
        label: "Cancel",
        type: "button",
        viewId: "row1"
    },
    delete: {
        id: "deleteSelected",
        label: "Delete",
        type: "button",
        viewId: "row1"
    }
};



const createSelectableItems = (formFields: FormField[]): Item[] => {
    return formFields.map(f => {
        return { label: f.label as string, value: f.id as string, selected: false };
    });

};
const updateSelection = (items: Item[], values: string[]) => {
    const newItems = items.map(itm => {
        if (values && values.length > 0) {
            for (let value of values) {
                if (itm.value === value) {
                    return { ...itm, selected: true };
                }
            }
        }
        return { ...itm, selected: false };
    });
    return newItems;
};

const deleteFormFields = (formFields: FormField[], items: Item[]) => {
    let modified = false;

    const newFormFields = formFields.filter((field) => {
        for (const itm of items) {
            if (itm.value === field.id && itm.selected) {
                modified = true;
                return false;
            }
        }
        return true;
    });
    return modified ? newFormFields : null;
};

export default DeleteFields;