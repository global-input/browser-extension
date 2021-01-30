import React, { useState } from 'react';

import * as storage from '../storage';
import * as cache from './cache';
import * as chromeExtension from '../chrome-extension';

import {useConnectMobile,getNextVisibilityValue,sendVisibility,buildFormFields,FIELDS} from './mobile-ui';

import type { FormField } from './mobile-ui';
import {DisconnectButton} from './mobile-ui';


import {Input,Label,Footer, DarkButton,Help,
    DomainField,FormPage,Important} from '../components';

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
    const [message,setMessage]=useState('');


    const onFormModified=(formFields: FormField[], isStructureChanged:boolean) => {
        if(isStructureChanged){
            storage.saveFormFields(userDomain, formFields);
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
    const onCopied=(formField:FormField)=>{
        const {key,message}=cache.saveRemainingFieldsToCache(domain,formField,formFields);
        if(key){
                chromeExtension.sendKey(key);
                message && setMessage(message);
        }

    }



    const mobile =useConnectMobile({domain:userDomain,formFields,configId,visibility,setVisibility,onFormModified,back},)


    return (
        <FormPage title="Form Data Transfer" mobile={mobile}>
            <DomainField>
                <Input id='changeDomain'  type="text"
                value={userDomain} placeholder="Domain"
                onChange={(evt)=>changeDomain(evt.target.value)}/>
                <Label htmlFor="changeDomain">Domain</Label>
                <Help position={3} expand={expand} setExpand={setExpand} expandId="changeDomain">
    This value is used when locating data in your mobile secure storage.
    It is also used to identify the form structure you have created in this application.
                </Help>

            </DomainField>
            {message && (<Important>{message}</Important>)}

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
                        selectedFields={selectedFields} setSelectedFields={setSelectedFields} onCopied={()=>{
                                onCopied(formField);

                        }}/>
                ))}
                <Footer>

{canDelete && (<DarkButton onClick={onDeleteSelected}>Deleted Selected</DarkButton>)}
<DarkButton onClick={back}>Back</DarkButton>

<DarkButton onClick={()=>{
    const vis = getNextVisibilityValue(visibility);
    setVisibility(vis);
    sendVisibility(mobile,vis);
}}>{visibility.label}</DarkButton>
<DisconnectButton mobile={mobile}>Disconnect</DisconnectButton>


</Footer>



<AddNewField formFields={formFields} onFormModified={onFormModified}/>


        </FormPage>

        );




};
