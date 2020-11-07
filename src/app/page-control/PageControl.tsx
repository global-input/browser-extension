import React, { useState, useEffect, useCallback } from 'react';
import { TextButton, MessageContainer, DisplayErrorMessage, LoadingCircle, ControlLayout } from '../app-layout';
import { useMobile } from '../mobile';

import * as rules from './rules';
import * as chromeExtension from '../chrome-extension';

interface Props {
    back: () => void;
    domain: string;
    toEditRule: () => void;
}
const PageControl: React.FC<Props> = ({ back, domain,toEditRule }) => {
    const mobile = useMobile({
        action: "input",
        dataType: "form",
        form: {
            title: "Page Control",
            fields: Object.values(FIELDS)
        }
    });

    const { sendValue } = mobile;
    const onError = useCallback((message: string) => {
        sendValue(FIELDS.domain.id, domain);
        sendValue(FIELDS.info.id, {
            content:message,
            style:{color:"brown"}
        });
    }, [sendValue]);

    mobile.setOnchange(({ field }) => {
        switch (field.id) {
            case FIELDS.back.id:
                back();
                break;
            case FIELDS.editRule.id:
                toEditRule();
                break;
            default:
        }
    });
    const { sendInitData } = mobile;

    const processRule = useCallback(async (rule: any) => {
        const message = await chromeExtension.getPageControlConfig(rule);
        if (message.status !== "success") {
            onError("The rule does not match the loaded page.");
            return;
        }
        if (message.content?.form?.fields?.length) {
            const fields = rules.buildFormFieldsFromMessageFields(rule, message.content.form.fields, (messageField, value) => {
                chromeExtension.sendFormField(messageField.id, value);
                if (messageField.matchingRule?.next) {
                    if (messageField.matchingRule?.next.type === 'refresh') {
                        processRule(rule);
                    }
                }
            });
            sendInitData({
                action: "input",
                dataType: "form",
                form: {
                    id: message.content.form.id,
                    title: message.content.form.title,
                    fields: [...fields, FIELDS.info, FIELDS.back, FIELDS.editRule]
                }
            });
        }
        else {

            onError("The rule does not set up controllable elements for the page loaded");
            return;
        }
    }, [sendInitData, onError]);
    useEffect(() => {
        if (!domain) {
            onError("The domain of the loaded page cannot be identified.");
            return;
        }
        let rule = rules.findRuleByDomain(domain);
        if (!rule) {
            onError("No matching rules found for the loaded page.");
            return;
        }
        processRule(rule);
    }, [domain, onError, processRule]);
    return (<ControlLayout title="Page Control" mobile={mobile}>
        <MessageContainer>Use your mobile to operate.</MessageContainer>
    </ControlLayout>);
}

const FIELDS = {
    domain:{
           id:"domain",
           type:"info",
           value:"Loading..."
    },
    info: {
        id: "info",
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


export default PageControl;