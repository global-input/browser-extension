import React, {useState,useCallback} from 'react';
import {useMobile} from '../utils';
import {InputWithLabel,TextButton,DisplayErrorMessage,FormContainer,FormFooter,MessageContainer} from '../app-layout';

interface PROPS {
    initialContent:string;
    contentOnComputer:  (content:string) => void;
    startEncrypt: (content:string) => void;
    cancel:(content:string) => void;
}

const ContentOnMobile:React.FC<PROPS> = ({initialContent,contentOnComputer,cancel,startEncrypt})=>{
    const [errorMessage, setErrorMessage]=useState('');
    const [content,setContent]=useState<string>(initialContent);
    const mobile=useMobile({
                        action:"input",
                        dataType:"form",
                        form:{
                            title:"Content To Encrypt",
                            fields:[{...FIELDS.content,value:initialContent},FIELDS.back,FIELDS.encrypt]
                        }
    });

    const onEncrypt=()=>{
         if(content.trim()){
            startEncrypt(content.trim());
         }
         else{
           setErrorMessage('Content missing!');
         }
    };
    const back=()=>{
        contentOnComputer(content);
    }
    mobile.setOnchange(({field})=>{
        switch(field.id){
                  case FIELDS.back.id:
                       back();
                       break;
                  case FIELDS.content.id:
                        setErrorMessage('');
                        setContent(field.value as string);
                        break;
                  case FIELDS.encrypt.id:
                        onEncrypt();
                        break;
                  default:
        }
   });
   const onContentChange=useCallback((value:string)=>{
        setErrorMessage('');
        setContent(value);
        mobile.sendValue(FIELDS.content.id,value);
   },[mobile]);


    return(
        <FormContainer title="Mobile Encryption">
            <mobile.ConnectQR/>
            {mobile.isConnected &&(<>
                <InputWithLabel label="Content to encrypt" id="content"
                            onChange={onContentChange}
                            type="textarea"
                            value={content}/>
            <DisplayErrorMessage errorMessage={errorMessage}/>
                            <FormFooter>
            <TextButton onClick={back} label='Back'/>
            <TextButton onClick={onEncrypt} label='Send To Mobile'/>

            </FormFooter>
            <MessageContainer title="test">
                Please provide the content in the text box above that you would like to encrypt .
                Then, press the "Send To Mobile" button to send it to your mobile for encryption.
            </MessageContainer>

            </>)}

        </FormContainer>
         );

};

const FIELDS={
    content:{
        id:"contentOnMobile",
        type:'text',
        nLines:5,
        value: 'null',
    },
    back:{
        id:'backToComposeOnComputer',
        type:'button',
        label:'back',
        viewId:"row1"
    },
    encrypt:{
        id:"toEncrypt",
        type:"button",
        label:"Encrypt",
        viewId:"row1"
    }
}

export default ContentOnMobile;