
import React, { useState, useCallback } from 'react';
import { useMobile } from '../mobile';
import { TextButton, MessageContainer, DisplayErrorMessage, LoadingCircle, FormFooter } from '../app-layout';
import * as rules from './rules';
import * as chromeExtension from '../chrome-extension';
const FIELDS = {
    domain: {
        id: "domain",
        type: "info",
        value: "..."
    },
    message: {
        id: "message",
        type: "info",
        value: ""
    },
    back: {
        id: 'back',
        type: "button",
        label: "Back",
        viewId: "row1"
    },
    editRule: {
        id: 'editRule',
        type: "button",
        label: "Edit Rule",
        viewId: "row1"
    }
};
export enum STATUS {
    LOADING,
    ERROR,
    SUCCESS
};

const messageValue = (message: string) => {
    return {
        content: message,
        style: { color: "brown" }
    }
};

const initData = (domain: string, message: string) => {
    return {
        action: "input",
        dataType: "form",
        form: {
            title: "Page Control",
            fields: [{ ...FIELDS.domain, value: domain }, { ...FIELDS.message, value: messageValue(message) }, FIELDS.back, FIELDS.editRule]
        }
    };
};
interface LoaderProps {
    back: () => void;
    domain: string;
    editRule: () => void;
}

export const useLoader = ({ back, domain, editRule }: LoaderProps) => {
    const [status, setStatus] = useState(STATUS.LOADING);
    const [message, setMessage] = useState('');

    const mobile = useMobile(initData(domain, message));

    const { sendValue } = mobile;
    const onError = useCallback((message: string) => {
        sendValue(FIELDS.message.id, messageValue(message));
        setMessage(message);
        setStatus(STATUS.ERROR);
    }, [sendValue]);

    mobile.setOnchange(({ field }) => {
        switch (field.id) {
            case FIELDS.back.id:
                back();
                break;
            case FIELDS.editRule.id:
                editRule();
                break;
            default:
        }
    });
    const display = (
        <>
            <MessageContainer>
                {status === STATUS.LOADING && (<LoadingCircle />)}
                {status === STATUS.ERROR && (<DisplayErrorMessage errorMessage={message} />)}
            </MessageContainer>
            <FormFooter>
                <TextButton onClick={back} label='Back' />
                <TextButton onClick={editRule} label='Edit Rule' />
            </FormFooter>
        </>
    );
    return { status, message, onError, mobile, display };
}



interface ControlProps {
    back: () => void;
    domain: string;
    form: rules.FormRule;
    editRule: () => void;
    loadRule: () => void;
}


export const useControl = ({ back, domain, form, editRule, loadRule }: ControlProps) => {
    const mobile = useMobile(() => {
        const fields = rules.buildFormFieldsFieldRules(form, (messageField, value) => {
            chromeExtension.sendFormField(messageField.id, value);
            if (messageField.matchingRule?.next) {
                if (messageField.matchingRule?.next.type === 'refresh') {
                    loadRule();
                }
            }
        });
        return {
            action: "input",
            dataType: "form",
            form: {
                id: form.id,
                title: form.title,
                fields: [...fields, FIELDS.message, FIELDS.back, FIELDS.editRule]
            }
        }

    });

    mobile.setOnchange(({ field }) => {
        switch (field.id) {
            case FIELDS.back.id:
                back();
                break;
            case FIELDS.editRule.id:
                editRule();
                break;
            default:
        }
    });
    const display = (
        <>
            <MessageContainer>
                You can use your mobile to operate on the page.
        </MessageContainer>
            <FormFooter>
                <TextButton onClick={back} label='Back' />
                <TextButton onClick={editRule} label='Edit Rule' />
            </FormFooter>
        </>
    );
    return { mobile, display };
}