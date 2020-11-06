import React, { useState, useEffect, useCallback } from 'react';
import { TextButton, MessageContainer, InputWithLabel, FormFooter, ControlLayout } from '../app-layout';
import { useMobile } from '../mobile';
import * as rules from './rules';
import * as storage from '../storage';

interface Props {
    back: () => void;
    domain: string;
}
const EditRule: React.FC<Props> = ({ back, domain }) => {

    const data=useState(()=>{
        const ruleString=storage.getPageControlRule(domain);
        if(ruleString){
            return {
                ruleString,
                presetIndex:0,
            }
        }


    })

    const mobile = useMobile({
        action: "input",
        dataType: "form",
        form: {
            title: "Edit Rules",
            fields: [{ ...FIELDS.domain }, FIELDS.editor, FIELDS.cancel, FIELDS.save]
        }
    });
    return (

        <ControlLayout title="Edit Rule" mobile={mobile}>

<InputWithLabel label="Configuration" id="config"
                            onChange={content=>{

                            }}
                            type="textarea"
                            value={""}/>
            <FormFooter>
            <TextButton onClick={()=>{

            }
            } label='Cancel'/>
            <TextButton onClick={()=>{}} label='Save'/>

            </FormFooter>
            <MessageContainer>
            </MessageContainer>

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
    }
};


export default EditRule;
