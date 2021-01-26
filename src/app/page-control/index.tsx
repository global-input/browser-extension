import React, { useEffect,useState} from 'react';
import { NoMobilePage,Error,  Message, DarkButton,AppTitle,Title, TipTitle,Spinner} from '../components';
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

    const onError=(errorTitle:string, errorMessage:string)=>{
        setErrorMessage(errorMessage);
        setErrorTitle(errorTitle);
        setStatus(STATUS.ERROR);
    };
    const processRule = async (rule: PageRule) => {
        const message = await chromeExtension.getPageControlConfig(rule);

        if (message.status !== "success") {
            onError("Not Found Error", "Failed to find elements matching what is specified in the rule. Please edit the rule and make it match the content of the page loaded on the current tab.");
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
                onError("Empty Field Error","At least one controllable field should be specified. Please edit the rule and define a controllable element in the page.");
            }


        }
        else {
            onError("Not Found Error","The loaded page does not contain the matching elements specified in the rule. Please edit the rule specifying the elements in the loaded page.");
            return;
        }
    };


    useEffect(() => {
        if (!domain) {
            onError("Domain Missing", "Failed to identify the domain of page loaded on the current tab.");
            return;
        }
        let rule = rules.findRuleByDomain(domain);
        if (!rule) {
            onError("Empty Rule",`There is no rule specified for ${domain}. Click on the 'Edit' button to define one.`);
            return;
        }
        processRule(rule);
    //eslint-disable-next-line react-hooks/exhaustive-deps
    }, [domain]);
    const footer=(<>
        <DarkButton onClick={back} >Back</DarkButton>
                <DarkButton onClick={editRule}>Edit Rule</DarkButton>
        </>);

    return (

        <NoMobilePage domain={domain} title="Page Control" footer={footer}>
            {status===STATUS.LOADING && (<DisplayLoading/>)}

            {status===STATUS.ERROR && <DisplayError  back={back} errorTitle={errorTitle} errorMessage={errorMessage} domain={domain} editRule={editRule}/>}
            {status===STATUS.SUCCESS && formRule && formFields && <DisplayPageControl domain={domain} formFields={formFields} formRule={formRule}
                back={back} editRule={editRule}>You can use your mobile to operate on the page.</DisplayPageControl>}
        </NoMobilePage>
    );
}

const DisplayLoading:React.FC=()=>{
    return (
        <>
    <Message>Processing rules for identifying elements in the loaded page to control using your mobile.</Message>
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
    const mobile=useConnectErrorControl(domain,back,editRule,errorTitle,errorMessage);
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