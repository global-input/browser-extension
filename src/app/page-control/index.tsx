import React, { useEffect,useState } from 'react';
import { PopupWindow, Error, TopBar, Content, Footer, DarkButton, TipTitle,Spinner, Domain } from '../components';
import * as rules from './rules';
import * as chromeExtension from '../chrome-extension';
import type { PageRule,FormRule} from './rules';
import type {FormField} from './mobile-ui';
import {useConnectToPageControl} from './mobile-ui';

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
    const [formFields, setFormFields]=useState<FormField[]|null>(null);
    const [formRule, setFormRule]=useState<FormRule|null>(null)
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
                setFormRule(message.content.form);
                const fields = rules.buildFormFieldsFieldRules(message.content?.form, (messageField, value) => {
                    chromeExtension.sendFormField(messageField.id, value);
                    if (messageField.matchingRule?.next) {
                        if (messageField.matchingRule?.next.type === 'refresh') {
                            processRule(rule);
                        }
                    }
                });
                if(fields && fields.length){
                    setFormFields(fields);
                    setStatus(STATUS.SUCCESS);
                }
                else{
                    onError("The matched rule returned should at least contain one form field.");
                }


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
                {status===STATUS.LOADING && (<DisplayLoading/>)}

                {status===STATUS.ERROR && <DisplayError>{errorMessage}</DisplayError>}
                {status===STATUS.SUCCESS && formRule && formFields && <DisplayPageControl domain={domain} formFields={formFields} formRule={formRule}>You can use your mobile to operate on the page.</DisplayPageControl>}

            </Content>
            <Footer>
                <DarkButton onClick={back} >Back</DarkButton>
                <DarkButton onClick={editRule}>Edit Rule</DarkButton>
            </Footer>
        </PopupWindow>
    );
}

const DisplayLoading:React.FC=()=>{
    return (<Spinner/>);
};


const DisplayError:React.FC=({children})=>{
    return (<Error>{children}</Error>);
};

interface DisplayPageControlProps{
    domain:string;
    formFields:FormField[];
    formRule:FormRule;
}
const DisplayPageControl:React.FC<DisplayPageControlProps>=({domain,formFields,formRule,children})=>{
    const mobile=useConnectToPageControl(domain,formFields,formRule);
    return (<TipTitle>{children}</TipTitle>);

}