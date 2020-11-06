import React, { useState, useEffect,useCallback } from 'react';
import { TextButton, Title,DisplayErrorMessage,MessageButton, InputWithLabel, FormFooter,FormContainer, ControlLayout } from '../../app-layout';
import { useMobile } from '../../mobile';



interface Props {
    back: () => void;
    domain: string;
    initialContent:string;
    saveRule:(content:string)=>void;
    loadLoadFromPreset:()=>void;

}
const Editor: React.FC<Props> = ({ back, domain, initialContent, saveRule,loadLoadFromPreset }) => {
    const [content,setContent] = useState<string>(initialContent);
    const [errorMessage,setErrorMessage]=useState('');
    const mobile = useMobile({
        action: "input",
        dataType: "form",
        form: {
            title: "Edit Rules",
            fields: [{ ...FIELDS.domain,value:domain }, {...FIELDS.editor,value:content}, FIELDS.cancel, FIELDS.save, FIELDS.loadFromPreset]
        }
    });
    const onSave= ()=>{
        try{
                content && JSON.parse(content);
            }
            catch(exception){
                setErrorMessage('Invalid content:'+exception);
                return;
            }
        saveRule(content);
    };
    mobile.setOnchange(({field})=>{
        switch(field.id){
            case FIELDS.cancel.id:
                back();
                break;
            case FIELDS.editor.id:
                setContent(field.value as string);
                break;
            case FIELDS.save.id:
                onSave();
                break;
            case FIELDS.loadFromPreset.id:
                loadLoadFromPreset();
                break;
            default:
        }
    });
    const {sendValue}=mobile;
    const onContentChange=useCallback((content:string)=>{
        setContent(content);
        sendValue(FIELDS.editor.id,content);
    },[sendValue]);

    return (

        <ControlLayout title="Edit Rule" mobile={mobile}>
            <FormContainer>

            <Title>{domain}</Title>
            <InputWithLabel label="Rule" id="content"
                onChange={onContentChange}
                type="textarea"
                value={content}/>
            {errorMessage && (
                <DisplayErrorMessage errorMessage={errorMessage}/>
            )}
            <FormFooter>
                <TextButton onClick={back} label='Cancel' />
                <TextButton onClick={onSave} label='Save' />
            </FormFooter>
            </FormContainer>
            <MessageButton label="Load Example" onClick={loadLoadFromPreset}/>
        </ControlLayout>);

}

const FIELDS = {
    domain: {
        type: 'info',
        value: '',
    },
    editor: {
        id: 'editor',
        type: 'text',
        nLines: 5,
        value: '',
        viewId: "row3"
    },
    cancel: {
        id: "cancelEdit",
        type: "button",
        label: "Cancel",
        viewId: "row4"
    },
    save: {
        id: "saveEdit",
        type: "button",
        label: "Save",
        viewId: "row4"
    },
    loadFromPreset:{
        id:"load-from-preset",
        type:"button",
        label:"Load Example",
        viewId: "row5"
    }
};


export default Editor;
