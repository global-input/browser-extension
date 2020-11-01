import React, { useCallback, useState } from 'react';
import { useMobile } from '../utils';
import {
    InputWithLabel, FormContainer, DisplayErrorMessage,
    TextButton, FormFooter, MessageContainer
} from '../app-layout';

interface PROPS {
    initialContent:string;
    contentOnMobile:  (content:string) => void;
    startEncrypt: (content:string) => void;
    cancel:()=>void;
}
const ContentOnComputer: React.FC<PROPS> = ({ initialContent,contentOnMobile,startEncrypt,cancel }) => {
    const [errorMessage, setErrorMessage] = useState<string>('');
    const [content, setContent] = useState(initialContent);
    const mobile = useMobile({
            action: "input",
            dataType: "form",
            form: {
                title: "Waiting for Content",
                fields: Object.values(FIELDS)
            }
    });
    const onChange = useCallback((value: string) => {
        setErrorMessage('');
        setContent(value);
    }, []);
    const onEncrypt = ()=>{
        if(content.trim().length){
            startEncrypt(content.trim());
       }
       else{
           setErrorMessage('Content missing!');
       }
    };
    mobile.setOnchange(({ field }) => {
        switch (field.id) {
            case FIELDS.cancel.id:
                cancel();
                break;
            case FIELDS.contentOnMobile.id:
                contentOnMobile(content);
                break;
            default:
        }
    });


    return (
        <FormContainer title="Mobile Decryption">
            <mobile.ConnectQR />

            <InputWithLabel label="Content to decrypt" id="content"
                onChange={onChange}
                type="textarea"
                value={content} />
            <DisplayErrorMessage errorMessage={errorMessage} />
            <FormFooter>
                <TextButton onClick={cancel} label='Cancel' />
                <TextButton onClick={onEncrypt} label='Send To Mobile' />
            </FormFooter>
            <MessageContainer title="this is a test">Please provide the content in the text box above that you would like to encrypt . Then, press the "Send To Mobile" button to send it to your mobile for encryption.
            </MessageContainer>
        </FormContainer>
    );


};


const FIELDS = {
    info: {
        type: 'info',
        value: 'Please operate on your computer (in the extension window) to provide the content you would like to encrypt.',
    },
    info2: {
        type: 'info',
        value: 'If you would like to use your mobile to provide content to encrypt, press the "Content on Mobile" button below.'
    },
    cancel: {
        id: "cancel",
        type: "button",
        label: "Cancel",
        viewId: "row1"
    },
    contentOnMobile: {
        id: "contentOnMobile",
        type: "button",
        label: "Content on Mobile",
        viewId: "row1"
    },
    startEncrypt: {
        id: "contentOnMobile",
        type: "button",
        label: "Content on Mobile",
        viewId: "row1"
    }
}


export default ContentOnComputer;