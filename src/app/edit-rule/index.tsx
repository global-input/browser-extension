import React, { useState } from 'react';


import * as rules from '../page-control/rules';
import {Label,DarkButton, Field, TextArea,Error,NoMobilePage} from '../components';

import {useConnectToMobile} from './mobile-ui';

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
    const {mobile, sendContent } = useConnectToMobile(domain,content, back,setContent,onSave,loadFromPreset);


    const  onContentChange = (content: string) => {
        setContent(content);
        sendContent(content);
    }

    const footer=(
        <>
            <DarkButton onClick={back}>Cancel</DarkButton>
            <DarkButton onClick={loadFromPreset}>Use Preset</DarkButton>
            <DarkButton onClick={onSave}>Save</DarkButton>
        </>
    );
    return (
    <NoMobilePage title="Edit Rules" domain={domain} footer={footer}>
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
      </NoMobilePage>
);



}
