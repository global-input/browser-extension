import React, { useState } from 'react';

import * as storage from '../storage';

import {useConnectMobile,getNextVisibilityValue,sendVisibility,buildFormFields,FIELDS} from './mobile-ui';

import type { FormField } from './mobile-ui';
import {ConnectWidget} from './mobile-ui';


import {Form,Input,Label,Footer, DarkButton,Help,
    ConnectContainer,DomainField,PopupWindow} from '../components';

import {DisplayInputField,AddNewField} from './forms';

interface Props {
    domain: string;
    back: () => void;
}
export const FormDataTransfer: React.FC<Props> = ({ domain, back }) => {
    const [userDomain, setUserDomain] = useState(domain);
    const [configId,setConfigId]=useState(0);
    const [selectedFields, setSelectedFields]=useState<FormField[]>([]);
    const [formFields, setFormFields] = useState(() => buildFormFields(domain));
    const [visibility, setVisibility] = useState(FIELDS.visibility.options[0]);
    const [expand,setExpand]=useState('');

    const onFormModified=(formFields: FormField[], isStructureChanged:boolean) => {
        if(isStructureChanged){
            storage.saveFormFields(domain, formFields);
            setConfigId(configId=>configId+1);
        }
        setSelectedFields([]);
        setFormFields(formFields);
    }

    const changeDomain = (domain:string) => {
        setUserDomain(domain);
        onFormModified(buildFormFields(domain),true);
    };


    const canDelete=!!selectedFields.length;
    const onDeleteSelected=()=>{
        const newFormFields=formFields.filter((f:FormField)=>selectedFields.indexOf(f)===-1);
        onFormModified(newFormFields,true);
    };



    const mobile =useConnectMobile({domain,formFields,configId,visibility,setVisibility,onFormModified})


    return (
        <PopupWindow>
            <DomainField>
                <Input id='changeDomain'  type="text"
                value={domain} placeholder="Domain"
                onChange={(evt)=>changeDomain(evt.target.value)}/>
                <Label htmlFor="changeDomain">Domain</Label>
                <Help expand={expand} setExpand={setExpand} expandId="changeDomain">
    This value is used when locating data in your mobile secure storage.
    It is also used to identify the form structure you have created in this application.
                </Help>

            </DomainField>



                <Form>
                    {formFields.map((formField:FormField, index:number) => (
                    <DisplayInputField  key={formField.id}
                        formField={formField} onChange={(value:string)=>{
                            const newFormFields=formFields.map((f:FormField)=>{
                                if (f === formField) {
                                    return {...f,value};
                                }
                                else{
                                    return f;
                                }
                            });
                            onFormModified(newFormFields,false);
                            mobile.sendValue(formField.id as string, value, index);
                        }}  visibility={visibility}
                        selectedFields={selectedFields} setSelectedFields={setSelectedFields}/>
                ))}
                </Form>







            <Footer>

                {canDelete && (<DarkButton onClick={onDeleteSelected}>Deleted Selected</DarkButton>)}
                <DarkButton onClick={()=>{
                    const vis = getNextVisibilityValue(visibility);
                    setVisibility(vis);
                    sendVisibility(mobile,vis);
                }}>{visibility.label}</DarkButton>
                {mobile.isConnected && (<DarkButton onClick={()=>mobile.restart()}>Disconnect</DarkButton>)}


            </Footer>



            <AddNewField formFields={formFields} onFormModified={onFormModified}/>


            <ConnectContainer>
                    <ConnectWidget mobile={mobile}/>
            </ConnectContainer>


        </PopupWindow>);




};
