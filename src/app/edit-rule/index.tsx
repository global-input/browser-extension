import React, { useState,useCallback } from 'react';
import { useMobile } from '../mobile';

import * as rules from '../page-control/rules';
import {Form,Input,Label,Footer, DarkButton,Help,
    DomainField,PopupWindow, TopBar,Content,Domain, Field, TextArea,Error} from '../components';

interface Props {
    back: () => void;
    domain: string;
    loadFromPreset:()=>void;
}

export const EditRule: React.FC<Props> = ({ back, domain,loadFromPreset }) => {
    const [content, setContent] = useState<string>(() => rules.getRulesForEdit(domain));
    const [errorMessage, setErrorMessage] = useState('');
    const saveRule = (content: string) => {
        if (content) {
            rules.saveRule(domain, content);
        }
        else {
            rules.removeRule(domain);
        }
        setContent(content);
        back();
    };
    const initData = () => ({
        form: {
            title: "Edit Rules",
            fields: [{ ...FIELDS.domain, value: domain }, FIELDS.info, { ...FIELDS.editor, value: content }, FIELDS.cancel, FIELDS.save, FIELDS.loadFromPreset]
        }
    });
    const mobile = useMobile(initData);
    const onSave = () => {
        try {
            content && JSON.parse(content);
        }
        catch (exception) {
            setErrorMessage('Invalid content:' + exception);
            return;
        }
        saveRule(content);
    };
    mobile.setOnchange(({field}) => {
        switch (field.id) {
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
                loadFromPreset();
                break;
            default:
        }
    });
    const { sendValue } = mobile;
    const onContentChange = useCallback((content: string) => {
        setContent(content);
        sendValue(FIELDS.editor.id, content);
    }, [sendValue]);


    return (
    <PopupWindow>
        <TopBar>
            Edit Rules
        </TopBar>
    <Content>
        <Domain>{domain}</Domain>
        <Form>

            <Field>
                <TextArea id="ruleContent"
                value={content}

                placeholder="Rules"
                    onChange={(evt=>{
                        onContentChange(evt.target.value);
                    })} />
                <Label htmlFor="ruleContent">Rules</Label>
            </Field>
                {errorMessage && (
            <Error>{errorMessage}errorMessage</Error>)}



</Form>

</Content>
<Footer>
            <DarkButton onClick={back}>Cancel</DarkButton>
            <DarkButton onClick={loadFromPreset}>Use Preset</DarkButton>
            <DarkButton onClick={onSave}>Save</DarkButton>
        </Footer>

</PopupWindow>
);



}




const FIELDS = {
    domain: {
        type: 'info',
        value: '',
    },
    info: {
        id: 'info',
        type: "info",
        value: "Please operate in the extension window on your computer",
        viewId: "row3"
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
    loadFromPreset: {
        id: "load-from-preset",
        type: "button",
        label: "Use Preset",
        viewId: "row5"
    }
};
