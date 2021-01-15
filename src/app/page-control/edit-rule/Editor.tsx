import React, { useState, useCallback } from 'react';
import { TextButton, Title, DisplayErrorMessage, InputWithLabel, FormFooter, FormContainer, BasicLayout } from '../../app-layout';
import { useMobile } from '../../mobile';
interface Props {
    back: () => void;
    domain: string;
    initialContent: string;
    saveRule: (content: string) => void;
    loadLoadFromPreset: () => void;

}
const Editor: React.FC<Props> = ({ back, domain, initialContent, saveRule, loadLoadFromPreset }) => {
    const [content, setContent] = useState<string>(initialContent);
    const [errorMessage, setErrorMessage] = useState('');
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
                loadLoadFromPreset();
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

        <BasicLayout title="Edit Rules">
            <FormContainer>

                <Title>{domain}</Title>
                <InputWithLabel label="Rules" id="content"
                    onChange={onContentChange}
                    type="textarea"
                    value={content} />
                {errorMessage && (
                    <DisplayErrorMessage errorMessage={errorMessage} />
                )}
                <FormFooter>
                    <TextButton onClick={back} label='Cancel' />
                    <TextButton label="Use Preset" onClick={loadLoadFromPreset} />
                    <TextButton onClick={onSave} label='Save' />
                </FormFooter>
            </FormContainer>

        </BasicLayout>);

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


export default Editor;
