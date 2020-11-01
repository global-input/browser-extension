import React, {useEffect, useState} from 'react';
import {useMobile} from '../utils';
import {InputWithCopy,TextButton,MessageContainer,FormContainer} from '../app-layout';

interface Props {
    content:string;
    showOnComputer:(content:string)=>void;

}

const EncryptContent:React.FC<Props> = ({content, showOnComputer})=>{
    const [errorMessage, setErrorMessage]=useState('');
    const mobile=useMobile({
            action:"input",
            dataType:"form",
            form:{
                title:"Content To Encrypt",
                fields:[{...FIELDS.content,value:content},FIELDS.back]
            }
    });

    mobile.setOnchange(({field})=>{
        switch(field.id){
                case FIELDS.content.id:
                        if(field.value){
                            showOnComputer(field.value as string)
                        }
                        else{
                            setErrorMessage("Failed to encrypt");
                        }
                        break;
                case FIELDS.back.id:
                        showOnComputer(content);
                        break;
        }
    });
    return(<MessageContainer title="Encrypting Content">
    Please follow the instruction on your mobile to encrypt the content.
    On your mobile, you can press the "Show" button to view the content it has received.
    Select one of the encryption keys that create and manage within the mobile app, and press the "Encrypt" button to encrypt the content.
  </MessageContainer>);

};

const FIELDS={
    content:{
        id:"encryptContent",
        label :"Content",
        type: 'encrypt',
        value:''},
    back:{
        id:"backToContent",
        label:"Back",
        type:"button",
        viewId:"row1"
    }
};

export default EncryptContent;
