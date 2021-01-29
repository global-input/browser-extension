import React, { useEffect,useState} from 'react';
import { NoMobilePage,Error,  Message, DarkButton,TipTitle,Spinner} from '../components';
import * as rules from './rules';
import * as chromeExtension from '../chrome-extension';
import type { PageRule,ProcessData} from './rules';
import {ProcessStep,processRule} from './rules';

import {useConnectToPageControl,useConnectErrorControl} from './mobile-ui';






interface Props {
    back: () => void;
    domain: string;
    editRule: () => void;
}



export const PageControl: React.FC<Props> = ({ back, domain, editRule}) => {
    const [processData, setProcessData] = useState<ProcessData>({step:ProcessStep.LOADING});

    const onEditRule=()=>editRule();

    const sendRuleToPage = async (rule:PageRule) => {
        const message = chromeExtension.getPageControlConfig(rule);
        return message;
    };

    const sendFieldValueToPage = (fieldId:string,value:string) => {
        chromeExtension.sendFormField(fieldId, value);
    };

    useEffect(() => {
        if (!domain) {
            setProcessData({step:ProcessStep.ERROR,
                errorTitle:'Domain Missing',
                errorMessage:'Failed to identify the domain of page loaded on the current tab.'});
            return;
        }
        let rule = rules.findRuleByDomain(domain);
        if (!rule) {
            setProcessData({step:ProcessStep.ERROR,
                errorTitle:'Empty Rule',
                errorMessage:`There is no rule specified for ${domain}. Click on the 'Edit' button to define one.`});
            return;
        }
        processRule({setProcessData, rule, domain, sendRuleToPage,sendFieldValueToPage});
    //eslint-disable-next-line react-hooks/exhaustive-deps
    }, [domain]);
    const footer=(<>
        <DarkButton onClick={back} >Back</DarkButton>
                <DarkButton onClick={onEditRule}>Edit Rule</DarkButton>
        </>);

    return (

        <NoMobilePage domain={domain} title="Page Control" footer={footer}>
            {processData.step===ProcessStep.LOADING && (<DisplayLoading/>)}

            {processData.step===ProcessStep.ERROR && <DisplayError  back={back} errorTitle={processData.errorTitle} errorMessage={processData.errorMessage} domain={domain} editRule={onEditRule}/>}
            {processData.step===ProcessStep.SUCCESS && (<DisplayPageControl processData={processData}
                back={back} editRule={onEditRule}>You can use your mobile to operate on the page.</DisplayPageControl>)}
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
    errorTitle?:string;
    errorMessage?:string;
}

const DisplayError:React.FC<ErrorProps>=({domain,back,editRule, errorTitle, errorMessage})=>{
    useConnectErrorControl(domain,back,editRule,errorTitle?errorTitle:'Error',errorMessage?errorMessage:'Unknown Error');
    return (<Error>{errorMessage}</Error>);
};

interface DisplayPageControlProps{
    processData:ProcessData
    back:()=>void;
    editRule:()=>void;
}
const DisplayPageControl:React.FC<DisplayPageControlProps>=({processData,children, back, editRule})=>{

    useConnectToPageControl(processData,back,editRule);
    return (<TipTitle>{children}</TipTitle>);

};
