import React,{useState,useEffect} from 'react';
import {TextButton,DisplayErrorMessage,LoadingCircle,ControlLayout} from '../app-layout';
import {useMobile} from '../mobile';

import * as rules from './rules';
import * as chromeExtension from '../chrome-extension';




interface Props {
    back:() => void;
    domain:string;
}
const PageControl:React.FC<Props> = ({back,domain}) => {
    const [errorMessage,setErrorMessage]=useState("");
    const [isLoading, setLoading]=useState(true);

    const mobile=useMobile({
        action: "input",
        dataType: "form",
        form:{
            title:"Page Control",
            fields: Object.values(FIELDS)
        }
    });
    const onError=(errorMessage:string,mobileMessage:string)=>{
        setLoading(false);
        setErrorMessage(errorMessage);
        mobile.sendValue(FIELDS.info.id, mobileMessage);
    }
    mobile.setOnchange(({field})=>{
        switch(field.id){
            case FIELDS.back.id:
                    back();
                    break;
        }
    });
    const buildControlFromRule= async (rule:any)=>{
        const message = await chromeExtension.getPageControlConfig(rule);
        if(message.status!=="success"){
            onError(`No matching HTML element found for the items specified in the configuration created for ${domain} domain. You can edit the configuration by clicking on the "Edit Control Config" button.`,
                "No matching HTML element found");
            return;
        }
        if(message.content?.form?.fields?.length){
            const fields=rules.buildFormFieldsFromMessageFields(rule,message.content.form.fields,(messageField, value)=>{
                chromeExtension.sendFormField(messageField.id,value);
                if(messageField.matchingRule?.next){
                    if(messageField.matchingRule?.next.type==='refresh'){
                        buildControlFromRule(rule);
                    }
                }
            });
            mobile.sendInitData({
                action: "input",
                dataType: "form",
                form:{
                    id:message.content.form.id,
                    title:message.content.form.title,
                    fields:[...fields,FIELDS.info,FIELDS.back,FIELDS.editRule]
                }
            });
        }
        else{
            onError(`Failed to locate any controllable elements in the page. You can edit the configuration by clicking on the "Edit Control Config" button.`,
                "Failed to locate any controllable elements in the page.");
            return;
        }
    }
    useEffect(()=>{
        if(!domain){
                onError("Failed to contact the page in the tab. Try again with a different website. Make sure that the active tab has completed loading a proper website from the Internet.",
                        "Failed to contact the page in the tab.");
                return;
        }
        let rule=rules.findRuleByDomain(domain);
        if(!rule){
            onError(`No rule is set for ${domain}. You can set up rule for ${domain} by clicking on the "Edit Rule" button.`,
            `No Rule set for ${domain}`);
            return;
        }
        buildControlFromRule(rule);
    },[]);
    return (<ControlLayout title="Page Control" mobile={mobile}>
        {isLoading && (<LoadingCircle/>)}
        {errorMessage && (<DisplayErrorMessage errorMessage={errorMessage}/>)}
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