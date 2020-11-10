import React, { useEffect } from 'react';
import * as rules from './rules';
import * as chromeExtension from '../chrome-extension';
import { useLoader } from './controllers';
import { ControlLayout } from '../app-layout';


interface Props {
    back: () => void;
    domain: string;
    rule: rules.PageRule;
    editRule: () => void;
    pageControl: (form: rules.FormRule) => void;
}

const ProcessControl: React.FC<Props> = ({ back, domain, rule, editRule, pageControl }) => {
    const { onError, display, mobile } = useLoader({ domain, back, editRule });
    useEffect(() => {
        if (!domain) {
            onError("The domain of the loaded page cannot be identified.");
            return;
        }
        const processRule = async () => {
            const message = await chromeExtension.getPageControlConfig(rule);
            if (message.status !== "success") {
                onError("The rule does not match the loaded page.");
                return;
            }
            if (message.content?.form?.fields?.length) {
                pageControl(message.content.form);
            }
            else {
                onError("The rule does not set up controllable elements for the page loaded");
                return;
            }
        };
        processRule();
    }, [domain, onError, rule, pageControl]);
    return (
        <ControlLayout title="Page Control" mobile={mobile}>
            {display}
        </ControlLayout>

    );
}


export default ProcessControl;