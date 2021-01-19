import React, { useEffect,useState } from 'react';
import { PopupWindow, Error, TopBar, Content, Footer, DarkButton, Spinner, Domain } from '../components';
import * as rules from './rules';
import * as chromeExtension from '../chrome-extension';
import type { PageRule } from './rules';

export enum STATUS {
    LOADING,
    ERROR,
    SUCCESS
};

interface Props {
    back: () => void;
    domain: string;
    editRule: () => void;
}

export const PageControl: React.FC<Props> = ({ back, domain, editRule}) => {
    const [status, setStatus] = useState(STATUS.LOADING);
    const [errorMessage, setErrorMessage]=useState('');
    useEffect(() => {
        const onError=(errorMessage:string)=>{
            setErrorMessage(errorMessage);
            setStatus(STATUS.ERROR);
        };
        const processRule = async (rule: PageRule) => {
            const message = await chromeExtension.getPageControlConfig(rule);
            if (message.status !== "success") {
                onError("The rule does not match the loaded page.");
                return;
            }
            if (message.content?.form?.fields?.length) {
                const fields = rules.buildFormFieldsFieldRules(message.content?.form, (messageField, value) => {
                    chromeExtension.sendFormField(messageField.id, value);
                    if (messageField.matchingRule?.next) {
                        if (messageField.matchingRule?.next.type === 'refresh') {
                            setStatus(STATUS.LOADING);
                        }
                    }
                });

            }
            else {
                onError("The rule does not set up controllable elements for the page loaded");
                return;
            }
        };
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
    }, [domain]);

    return (
        <PopupWindow>
            <TopBar>Page Control</TopBar>
            <Content>
                <Domain>{domain}</Domain>
                {status===STATUS.LOADING && (<Spinner/>)}
                {status===STATUS.ERROR && <Error>{errorMessage}</Error>}
            </Content>
            <Footer>
                <DarkButton onClick={back} >Back</DarkButton>
                <DarkButton onClick={editRule}>Edit Rule</DarkButton>
            </Footer>
        </PopupWindow>
    );
}
