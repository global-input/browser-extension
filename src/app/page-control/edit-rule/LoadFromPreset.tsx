import React, { useState, useCallback, useMemo } from 'react';
import { TextButton, SelectItems, InputWithLabel, FormFooter, FormContainer, BasicLayout } from '../../app-layout';
import { useMobile } from '../../mobile';
import * as rules from '../rules';


interface Props {
    back: () => void;
    domain: string;
    loadRule: (content: string) => void;
}
const Editor: React.FC<Props> = ({ back, domain, loadRule }) => {
    const [selectedValue, setSelectedValue] = useState('0');
    const [content, setContent] = useState<string>(() => rules.getPresetRuleByIndexForEdit(0));
    const selectionItems = useMemo(() => {
        return rules.buildSelectionItems()
    }, [])

    const mobile = useMobile("Preset Rules", [FIELDS.info, { ...FIELDS.editor, value: content }, FIELDS.back, FIELDS.use]);

    const onUse = () => loadRule(content);

    mobile.setOnFieldChange((field) => {
        switch (field.id) {
            case FIELDS.back.id:
                back();
                break;
            case FIELDS.editor.id:
                setContent(field.value as string);
                break;
            case FIELDS.use.id:
                onUse();
                break;
        }
    });
    const { sendValue } = mobile;
    const onContentChange = useCallback((content: string) => {
        setContent(content);
        sendValue(FIELDS.editor.id, content);
    }, [sendValue]);
    const onChangeContent = (content: string) => {
        setContent(content);
        mobile.sendValue(FIELDS.editor.id, content);
    }

    const onSelectionChange = (evt: React.ChangeEvent<HTMLSelectElement>) => {
        setSelectedValue(evt.target.value);
        const rule = rules.getPresetRuleByIndexForEdit(parseInt(evt.target.value));
        onChangeContent(rule);
    }


    return (

        <BasicLayout title="Preset Rules">
            <FormContainer>
                <SelectItems id="rulSelection" items={selectionItems} value={selectedValue} label="Select:" onChange={onSelectionChange} />
                <InputWithLabel label="Rule" id="content"
                    onChange={onContentChange}
                    type="textarea"
                    value={content} />



                <FormFooter>
                    <TextButton onClick={back} label='Cancel' />
                    <TextButton onClick={onUse} label='Use' />
                </FormFooter>

            </FormContainer>


        </BasicLayout>);

}

const FIELDS = {
    info: {
        id: 'info',
        type: "info",
        value: "Please operate in the extension window on your computer"
    },
    editor: {
        id: 'editor',
        type: 'text',
        nLines: 5,
        value: '',
        viewId: "row3"
    },
    back: {
        id: "back-to-edit",
        type: "button",
        label: "Back",
        viewId: "row4"
    },
    use: {
        id: "use",
        type: "button",
        label: "Use",
        viewId: "row4"
    }
};


export default Editor;
