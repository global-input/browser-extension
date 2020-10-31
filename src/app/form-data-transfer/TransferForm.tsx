import React,{useState} from 'react';
import {FormField,useGlobalInputApp} from 'global-input-react';
import * as appSettings from '../appSettings';

interface Props{
    formFields:FormField[]; 
    domain:string;     
};
const TransferForm = (props:Props)=>{
    const [visibility, setVisibility]=useState(FIELDS.visibility.options[0]); 
    

    const mobile=useGlobalInputApp(() => {  
        const id=computerFormId(props.domain,props.formFields);          
        return {
            initData:{
                    form:{                
                            id,
                            title:props.domain,
                            label:"web",
                            domain:props.domain,
                            fields:[...Object.values(FIELDS),                
                                    ...props.formFields]
                    }
            },            
            options:appSettings.getGlobalInputSettings()
        };
    });

return null;

}



    

const FIELDS={
    visibility:{
        id:"fieldValueVisibility",
        type:'button',  
        viewId: "row0",            
        options: [{ value: 0, label: 'Show' }, { value: 1, label: 'Hide'}],        
        value:0
    },
    addNewField:{
        id:"addNewField",
        type:"button",
        label:"Add New Field",
        viewId:"row1"
    },
    deleteField:{
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

const computerFormId = (domain:string,fields:FormField[])=>{
    const id=fields.length?'###'+fields[0].id+'###':'credential';
    return id+'@'+domain;    
};

export default TransferForm;