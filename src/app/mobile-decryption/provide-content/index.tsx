import React, { useCallback, useState } from 'react';
import * as onComputer from './mobile-ui/onComputer';
import * as onMobile from './mobile-ui/onMobile';
import type {MobileData} from 'global-input-mobile';
import {
    Footer,DarkButton, Field,TextArea, Label,Help, NoMobilePage} from '../../components';

interface PROPS{
    initialContent: string;
    startDecrypt: (content: string) => void;
    cancel: () => void;
    domain: string;
}

export const ContentOnMobile: React.FC<PROPS> = ({ initialContent, cancel, startDecrypt, domain }) => {
    const [content, setContent] = useState<string>(initialContent);

    const onDecrypt = () => {
        processDecrypt(mobile,content,startDecrypt,onMobile.FIELDS.info.id);
    };
    const mobile = onMobile.useConnectMobile({initialContent,cancel,setContent,onDecrypt});
    const { sendValue } = mobile;
    const onContentChanged = useCallback((value: string) => {
        setContent(value);
        sendValue(onMobile.FIELDS.content.id, value);
    }, [sendValue]);
    return (
        <RenderContentForm content={content} onContentChanged={onContentChanged} cancel={cancel} onDecrypt={onDecrypt}/>
    );
};

interface PROPSForOnComputer extends PROPS{
    contentOnMobile: (content: string) => void;
}


export const ContentOnComputer: React.FC<PROPSForOnComputer> = ({ initialContent, contentOnMobile, startDecrypt, cancel, domain }) => {
    const [content, setContent] = useState(initialContent);
    const onDecrypt = () => {
        processDecrypt(mobile,content,startDecrypt,onComputer.FIELDS.info.id);
    };
    const onContentOnMobile=()=> contentOnMobile(content);

    const mobile = onComputer.useConnectMobile({cancel,onContentOnMobile,onDecrypt});
    const onContentChanged = useCallback((value: string) => {
            setContent(value);
    }, []);

    return (
        <RenderContentForm content={content} onContentChanged={onContentChanged} cancel={cancel} onDecrypt={onDecrypt}/>
        );
};






const processDecrypt=(mobile:MobileData,content:string, startDecrypt:(content:string)=>void, infoId:string) => {
    if (content.trim().length) {
        startDecrypt(content.trim());
    }
    else {
        mobile.sendValue(infoId, {
           content: 'Please provide the content to decrypt using the application connected to your mobile app.',
           style:{color:'red'}
        });
    }
};

interface ContentFormProps{
    content:string;
    onContentChanged:(content:string)=>void;
    cancel:()=>void;
    onDecrypt:()=>void;
}

const RenderContentForm:React.FC<ContentFormProps>=({content,onContentChanged,cancel,onDecrypt})=>{
    const [expand,setExpand]=useState('contentToDecrypt');
    const footer=(<>
        <DarkButton onClick={cancel}>Cancel</DarkButton>
        <DarkButton onClick={onDecrypt}>Decrypt</DarkButton>
    </>);
    return (<NoMobilePage title="Content To Decrypt" footer={footer}>
                <Field>
                        <TextArea id="contentToDecrypt" onChange={(evt:any)=>{
                        onContentChanged(evt.target.value);
                        }} value={content} placeholder="Place here the content to decrypt."
                        onFocus={()=>setExpand('contentToDecrypt')}/>
                        <Label htmlFor="contentToDecrypt">Content to Decrypt</Label>
                        <Help expandId='contentToDecrypt' expand={expand} setExpand={setExpand}>
                        The content you have provided will be sent to your mobile app.
                        You mobile app will decrypt it and send back the result to this application.
                        </Help>
                </Field>
    </NoMobilePage>);

}
