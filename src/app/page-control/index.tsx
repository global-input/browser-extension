import React, { useEffect,useState, useCallback} from 'react';
import { PopupWindow, Error, AppContent,TopBar, Content, Message, Footer, DarkButton,AppTitle,Title, TipTitle,Spinner, Domain } from '../components';
import * as rules from './rules';
import * as chromeExtension from '../chrome-extension';
import type { PageRule,FormRule} from './rules';
import type {FormField} from './mobile-ui';
import {useConnectToPageControl,useConnectErrorControl} from './mobile-ui';

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
    const [errorTitle,setErrorTitle]=useState('');
    const [formFields, setFormFields]=useState<FormField[]|null>(null);
    const [formRule, setFormRule]=useState<FormRule|null>(null)

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


    useEffect(() => {
        if (!domain) {
            onError("The domain of the loaded page cannot be identified.");
            return;
        }
        let rule = rules.findRuleByDomain(domain);
        // rule=null;
        // if (!rule) {
        //     onError("No matching rules found for the loaded page.");
        //     return;
        // }
        // processRule(rule);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [domain]);

    return (
        <PopupWindow>
            <TopBar><AppTitle>Global Input App</AppTitle></TopBar>
            <Content>
                <AppContent>
                <Title>Page Control</Title>
                <Domain>{domain}</Domain>
                {status===STATUS.LOADING && (<DisplayLoading/>)}

                {status===STATUS.ERROR && <DisplayError  back={back} errorTitle={errorTitle} errorMessage={errorMessage} domain={domain} editRule={editRule}/>}
                {status===STATUS.SUCCESS && formRule && formFields && <DisplayPageControl domain={domain} formFields={formFields} formRule={formRule}
                    back={back} editRule={editRule}>You can use your mobile to operate on the page.</DisplayPageControl>}
                <Footer>
                <DarkButton onClick={back} >Back</DarkButton>
                <DarkButton onClick={editRule}>Edit Rule</DarkButton>
            </Footer>
                </AppContent>
            </Content>

        </PopupWindow>
    );
}

const DisplayLoading:React.FC=()=>{
    return (
        <>
    <Message>Processing rules for identifying parts of the page that you can control using your mobile.</Message>
    <Spinner/>
    </>
    );
};

interface ErrorProps{
    domain:string;
    back:()=>void;
    editRule:()=>void;
    errorTitle:string;
    errorMessage:string;
}

const DisplayError:React.FC<ErrorProps>=({domain,back,editRule, errorTitle, errorMessage})=>{
    const mobile=useConnectErrorControl(domain,back,editRule,errorTitle);
    return (<Error>{errorMessage}</Error>);
};

interface DisplayPageControlProps{
    domain:string;
    formFields:FormField[];
    formRule:FormRule;
    back:()=>void;
    editRule:()=>void;
}
const DisplayPageControl:React.FC<DisplayPageControlProps>=({domain,formFields,formRule,children, back, editRule})=>{
    const mobile=useConnectToPageControl(domain,formFields,formRule,back,editRule);
    return (<TipTitle>{children}</TipTitle>);

}