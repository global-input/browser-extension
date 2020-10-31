import React,{useState,useCallback} from 'react';

import {FormField,useGlobalInputApp} from 'global-input-react';
import * as appSettings from '../appSettings';
import {FormContainer,DisplayInputCopyField,TextButton} from '../app-layout';
import AddNewField from './AddNewField';
import DeleteFields from './DeleteFields';

enum PAGES{
    TRANSFER_FORM_HOME,
    ADD_FIELD,  
    DELETE_FIELDS,
    EDIT_FORM_PROPERTIES 
};

interface Props {
    domain:string;
    back:()=>void;
}
const FormDataTransfer:React.FC<Props> = ({domain,back})=>{
    const [page,setPage]=useState(PAGES.TRANSFER_FORM_HOME);    
    const [formFields,setFormFields]=useState(()=>buildFormFields(domain));
    const onFormStructureChanged=(formFields:FormField[])=>{        
        setFormFields(formFields);
        if(formFields.length){
            const formsFieldsToSave=formFields.map(f=>({...f,value:undefined}));    
            var fieldString=JSON.stringify(formsFieldsToSave);
            localStorage.setItem(getFormFieldsPrefix(domain),fieldString);               
        }
        else{
                localStorage.removeItem(getFormFieldsPrefix(domain));
        }                        
    };
    const toTransfer=()=>setPage(PAGES.TRANSFER_FORM_HOME);    
    switch(page){
        case PAGES.TRANSFER_FORM_HOME:
                return (<TransferFormHome domain={domain} formFields={formFields} setFormFields={setFormFields} setPage={setPage} back={back}/>);
        case PAGES.ADD_FIELD:
                return (<AddNewField formFields={formFields} onFormStructureChanged={onFormStructureChanged} back={toTransfer}/>);
        case PAGES.DELETE_FIELDS:
                return (<DeleteFields formFields={formFields} onFormStructureChanged={onFormStructureChanged} back={toTransfer}/>);                        
        default:            
    }
    return null
};



const getFormFieldsPrefix= (domain:string) => {
    const domainPart=domain?domain:'default';    
    return "extension.forms.fields."+domainPart;
};

const loadSavedFormFields= (domain:string) => {
    var fieldString=localStorage.getItem(getFormFieldsPrefix(domain));
    if(!fieldString){
        return null;
    }            
    try{
            const fields=JSON.parse(fieldString);
            if(fields && fields.length>0){
                return fields;   
            }            
    }
    catch(error){
              console.error(error);
    }
    return null;
};





const computerFormId = (domain:string,fields:FormField[])=>{
    const id=fields.length?'###'+fields[0].id+'###':'credential';
    return id+'@'+domain;    
}

const FIELDS={
    visibility:{
        id:"fieldValueVisibility",
        type:'button',  
        viewId: "row0",            
        options: [{ value: 0, label: 'Show' }, { value: 1, label: 'Hide'}],        
        value:0
    },
    add:{
        id:"addNewField",
        type:"button",
        label:"Add New Field",
        viewId:"row1"
    },
    delete:{
        id:"deleteFields",
        type:"button",
        label:"Delete Fields",
        viewId:"row1" 
    },
    back:{
        id:"backToHome",
        type:"button",     
        label:"Back",
        viewId:"row2"
    }
};

const defaultFormFields=[{
        id: "username",
        label: "Username", 
        value:''
    },{
    id:"password",
    label:"Password", 
    value:''
    },{
    id:"note",
    label:"Note",
    nLines:5, value:'',
    }];


const buildFormFields =(domain:string)=>{        
    let fields=loadSavedFormFields(domain);         
    if(!fields){
        fields =defaultFormFields;
    }
    return fields;    
};
const computeChangedFormFields=(formFields:FormField[],fieldId:string|null|undefined,value:string,index:number)=>{
    let fieldModified=false;        
    const fields=formFields.map((f,ind)=>{
        if(fieldId){
            if(f.id===fieldId){
                fieldModified=true;
                return {...f,value};
            }
        }            
        else {
            if(index >= 0 && index < formFields.length){                                     
                  if(ind===index){
                    fieldModified=true;
                    return {...f,value};
                  }                            
            }
        }                        
        return f;            
    });
    if(fieldModified){
        return fields;            
    }   
    return null;        
}



interface TransferFormHomeProps{    
    domain:string;
    formFields:FormField[]; 
    setFormFields:(formFields:FormField[])=>void;
    setPage:(page:PAGES)=>void;
    back:()=>void;
};
const TransferFormHome : React.FC<TransferFormHomeProps>=({domain,formFields, setFormFields,setPage,back})=>{
    const [visibility, setVisibility]=useState(FIELDS.visibility.options[0]);     
    const mobile=useGlobalInputApp(() => {  
        const id=computerFormId(domain,formFields);          
        return {
            initData:{
                    form:{                
                            id,
                            title:domain,
                            label:"web",
                            domain:domain,
                            fields:[...Object.values(FIELDS),                
                                    ...formFields]
                    }
            },            
            options:appSettings.getGlobalInputSettings()
        };
    });
    
   const toggleVisibility=useCallback(() => {
        const vis=visibility===FIELDS.visibility.options[0]?FIELDS.visibility.options[1]:FIELDS.visibility.options[0];
        setVisibility(vis);
        mobile.sendValue(FIELDS.visibility.id,vis.value);
   },[visibility,mobile]);



    mobile.setOnchange(({field})=>{
       switch(field.id){
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
                    for(const [index, formField] of formFields.entries()){
                        if(formField.id===field.id){
                            const changedFormFields=computeChangedFormFields(formFields,formField.id,field.value as string,index);
                            if(changedFormFields){
                                setFormFields(changedFormFields);
                            }
                        }
                    }    
       }
    });


    

    const onCopied=()=>{

    }

return (<FormContainer title="Form Data Transfer" domain={domain}>
            <mobile.ConnectQR/>
            {mobile.isConnected && (<>
                {formFields.map((formField,index)=>(<DisplayInputCopyField 
                                field={formField} 
                                key={formField.id} 
                                onCopied={onCopied}
                                hideValue={visibility.value===0} onChange={value=>{                                    
                                     const changedFormFields=computeChangedFormFields(formFields,formField.id,value,index);
                                     if(changedFormFields){
                                         setFormFields(changedFormFields);                                         
                                         mobile.sendValue(formField.id as string,value,index);
                                     }
                                }
                                }/>))}
            </>)}
            <TextButton onClick={toggleVisibility} label={visibility.label}/>

        </FormContainer>);


};

export default FormDataTransfer;