import React, { useState, useCallback, useMemo } from 'react';

import {Form,Input,Label,Footer, DarkButton,Help,
    DomainField,PopupWindow, TopBar,Content,Domain, Field, TextArea,Error,Select,Option} from '../components';

import { useMobile } from '../mobile';
import * as rules from '../page-control/rules';


interface Props {
    domain: string;
    editRule: (content?: string) => void;
}
const Editor: React.FC<Props> = ({ editRule, domain}) => {
    const [selectedValue, setSelectedValue] = useState('0');
    const [content, setContent] = useState<string>(() => rules.getPresetRuleByIndexForEdit(0));
    const selectionItems = useMemo(() => {
        return rules.buildSelectionItems()
    }, [])

    const initData = {
        form: {
            title: "Preset Rules",
            fields: [FIELDS.info, { ...FIELDS.editor, value: content }, FIELDS.back, FIELDS.use]
        }
    };

    const mobile = useMobile(initData);

    const onUse = () => editRule(content);

    mobile.setOnchange(({field}) => {
        switch (field.id) {
            case FIELDS.back.id:
                editRule();
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
    <PopupWindow>
            <TopBar>Preset Rules</TopBar>
            <Content>
            <Form>
            <Field>
                <Select value={selectedValue} onChange={onSelectionChange}>
                {selectionItems.map(f=>( <Option key={f.value} value={f.value}>{f.label}</Option>))}
              </Select>
            </Field>
              <Field>
                <TextArea id="ruleContent"
                value={content}

                placeholder="Rules"
                    onChange={(evt=>{
                        onContentChange(evt.target.value);
                    })} />
                <Label htmlFor="ruleContent">Rules</Label>
            </Field>


            </Form>
            </Content>
            <Footer>
            <DarkButton onClick={onUse}>Use</DarkButton>

            </Footer>
            </PopupWindow>
        );

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
