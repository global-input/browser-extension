import React, { ChangeEvent, useState } from 'react';
import type {FormField} from './mobile-ui';
import {
    Field, Input, TextArea, Label, CopyToClipboardButton,
    InputGroup, CheckBox,Form,Form2,Title,Select,Option,DarkButton,Footer,NoMobilePage
} from '../components';

const isFieldChecked= (formField:FormField,selectedFields:FormField[]) => !!selectedFields.filter(s => s === formField).length;

interface VisibilityOption{
    value:number;
    label:string;

}

type  ChangeEventHandler=(value:string)=>void;

interface DisplayInputFieldProps{
    formField:FormField;
    onChange:ChangeEventHandler;
    visibility:VisibilityOption;
    selectedFields:FormField[];
    setSelectedFields:(fields:FormField[])=>void;
    onCopied:()=>void;

}
export const DisplayInputField:React.FC<DisplayInputFieldProps> = ({
    formField, onChange, visibility,
    selectedFields, setSelectedFields,onCopied }) => {

    const [focused, setFocused] = useState(false);
    const checked = isFieldChecked(formField,selectedFields);
    const showCheckbox=(!focused) && (!formField.value);
    const type=visibility.value === 0 ? 'password' : 'text'
    const setChecked = () => {
            setSelectedFields([...selectedFields, formField]);
    };
    const setUnchecked = () => {
            setSelectedFields(selectedFields.filter(s => s !== formField));
    };
    const toggleSelect = () => {
        if (checked) {
            setUnchecked();
        }
        else {
            setChecked();
        }
    };
    const onFocus=()=>{
        setFocused(true);
        setUnchecked();
    }
    const onBlur=()=>{
        setFocused(false)
    }
    if (visibility.value === 0 || (!formField.nLines) || formField.nLines <= 1) {
        return (
            <InputGroup>
                {showCheckbox && (<CheckBox checked={checked} onChange={toggleSelect} />)}
                <Field>
                    <Input id={formField.id} type={type}
                    value={formField.value?formField.value as string:''}
                    placeholder={formField.label}
                    onChange={((evt:any)=>{
                        onChange(evt.target.value);
                    })}
                    onFocus={onFocus}
                    onBlur={onBlur} />
                    <Label htmlFor={formField.id}>{formField.label}</Label>
                </Field>
                <CopyToClipboardButton value={formField.value as string} position={3} onCopied={onCopied}>Copy</CopyToClipboardButton>
            </InputGroup>
        );


    }
    else {
        return (
            <InputGroup>
            {showCheckbox && (<CheckBox checked={checked} onChange={toggleSelect} />)}
            <Field>
                <TextArea id={formField.id} value={formField.value?formField.value as string:''} placeholder={formField.label}
                    onChange={((evt:any)=>{
                        onChange(evt.target.value);
                    })} />
                <Label htmlFor={formField.id}>{formField.label}</Label>
            </Field>
            <CopyToClipboardButton value={formField.value as string} position={3}>Copy</CopyToClipboardButton>

        </InputGroup>
        );

    }
};


interface DisplayCacheFieldProps{
    formField:FormField;
    onCopied:()=>void;
}

export const DisplayCacheField:React.FC<DisplayCacheFieldProps> = ({
    formField, onCopied }) => {
        return (
            <InputGroup>
                <Field>
                    <Input id={formField.id} type='password'
                    value={formField.value as string}
                    placeholder={formField.label} readOnly={true}/>
                    <Label htmlFor={formField.id}>{formField.label}</Label>
                </Field>
                <CopyToClipboardButton value={formField.value as string} position={3} onCopied={onCopied}>Copy</CopyToClipboardButton>
            </InputGroup>
        );
};




const FIELD_TYPES=[{value:'single-line', label:'Single Line Field'},
                 {value:'multi-line', label:'Multi Line Field'},
                 {value:'password', label:'Password Field'}]
interface AddNewFieldProps{
    formFields:FormField[];
    onFormModified:(formFields:FormField[],isStructureChanged:boolean)=>void
}
export const AddNewField:React.FC<AddNewFieldProps>=({formFields,onFormModified})=>{
    const [label, setLabel] = useState('');
    const [fieldType, setFieldType] = useState(FIELD_TYPES[0]);
    const onChange=(evt:ChangeEvent<HTMLInputElement>)=>{
        setLabel(evt.target.value);
    };
    const onAddNewField=()=>{
        const fieldName = label.trim();
        if (!fieldName) {
            return;
        }
        const nLines = fieldType === FIELD_TYPES[1] ? 5 : 1;
        const id = label.replace(' ', "_").toLowerCase();
        for (let f of formFields) {
            if (f.id === id) {
                return;
            }
        }
        const type = fieldType === FIELD_TYPES[2] ? 'secret' : 'text';
      const newFormFields=[...formFields, { id, label, type, value: '', nLines }];
      onFormModified(newFormFields,true);
    }
    const onSelectChange=(evt:ChangeEvent<HTMLSelectElement>)=>{
        const matched=FIELD_TYPES.filter(f=>f.value===evt.target.value);
        if(matched.length){
            setFieldType(matched[0]);
        }
    }

    return (
        <Form2>
            <Title>Add new field</Title>
            <Field>
            <Input id="addFieldLabel" type="text"
                        value={label}
                        placeholder="Field Name"
                        onChange={onChange}/>
                        <Label htmlFor="addFieldLabel">Field Name</Label>
            </Field>
            <Field>
            <Select value={fieldType.value} onChange={onSelectChange}>
                {FIELD_TYPES.map(f=>( <Option key={f.value} value={f.value}>{f.label}</Option>))}
              </Select>

            </Field>




            <Footer>
            <DarkButton onClick={onAddNewField}>Add</DarkButton>
            </Footer>

        </Form2>

    );
};
