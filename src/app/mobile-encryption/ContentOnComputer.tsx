import React,{useCallback, useState} from 'react';
import {useGlobalInputApp} from 'global-input-react';
import {InputWithLabel,FormContainer,DisplayErrorMessage,
    TextButton, FormFooter,MessageContainer} from '../app-layout';

interface PROPS {
    back:()=>void;
}
const ContentOnComputer:React.FC<PROPS> = ({back})=>{
    const [errorMessage, setErrorMessage]=useState<string>('');
    const [content, setContent] = useState('');
    const mobile=useGlobalInputApp({initData:{
        action: "input",
        dataType: "form",
        form:{
            title:"Waiting for Content",
            fields:Object.values(FIELDS)
        }
    }});
    const onChange=useCallback((value:string)=>{
        setErrorMessage('');
        setContent(value);
    },[]);
    mobile.setOnchange(({field})=>{
        switch(field.id){
            case FIELDS.back.id:
                    back();
                    break;
            default:
        }
    });

    return(
        <FormContainer title="Mobile Decryption">              
        <mobile.ConnectQR />

            <InputWithLabel label="Content to decrypt" id="content"
                onChange={onChange}
                type="textarea"
                value={content}/>   
            <DisplayErrorMessage errorMessage={errorMessage}/>
            <FormFooter>
                <TextButton onClick={()=>{                
                    
                }
                } label='Back'/>
                <TextButton onClick={()=>{}} label='Send To Mobile'/>
            </FormFooter>
            <MessageContainer title="this is a test">Please provide the content in the text box above that you would like to encrypt . Then, press the "Send To Mobile" button to send it to your mobile for encryption.
            </MessageContainer>            
        </FormContainer>
         );


};


const FIELDS={
    back:{
        id:"backToHome",
        type:"button",
        label:"Back",        
        viewId:"row1"
    },
    info:{
        type:'info',
        value: 'Please operate on your computer (in the extension window) to provide the content you would like to encrypt.',
    },
    toMobile:{
        id:"ComposeOnMobile",
        type:"button",            
        label:"Use Mobile",
        viewId:"row1"
    }
}


export default ContentOnComputer;