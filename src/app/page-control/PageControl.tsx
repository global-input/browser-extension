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
        sendValue(FIELDS.info.id, {
            content:message,
            style:{color:"red"}
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
            onError(`No matching HTML element found for the items specified in the configuration created for ${domain} domain. You can edit the configuration by clicking on the "Edit Control Config" button.`);
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

            onError(`Failed to locate any controllable elements in the page. You can edit the configuration by clicking on the "Edit Control Config" button.`);
            return;
        }
    }, [domain, sendInitData, onError]);
    useEffect(() => {
        if (!domain) {
            onError("Failed to contact the page in the tab. Try again with a different website. Make sure that the active tab has completed loading a proper website from the Internet.");
            return;
        }
        let rule = rules.findRuleByDomain(domain);
        if (!rule) {
            onError(`No rule is set for ${domain}. You can set up rule for ${domain} by clicking on the "Edit Rule" button.`);
            return;
        }
        processRule(rule);
    }, [domain, onError, processRule]);
    return (<ControlLayout title="Page Control" mobile={mobile}>
        <MessageContainer>You can use your mobile to operate on the page.</MessageContainer>
    </ControlLayout>);
}

const FIELDS = {
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