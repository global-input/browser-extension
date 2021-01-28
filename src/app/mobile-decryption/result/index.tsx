import React,{useState} from 'react';
import * as onComputer from './mobile-ui/onComputer';
import * as onMobile from './mobile-ui/onMobile';

import {DarkButton,NoMobilePage,Field,TextArea, Label,CopyToClipboardButton, Help} from '../../components';
interface Props {
    domain: string;
    content: string;
    contentOnComputer:(content:string)=>void;
    finish: () => void;


}
export const ShowResultOnMobile: React.FC<Props> = ({ content, contentOnComputer, finish, domain }) => {
     const restart = () => contentOnComputer('');
     onMobile.useConnectMobile({content,restart,finish});
        return (
            <RenderContentForm content={content} restart={restart} finish={finish}/>
        );
};


interface OnComputerProps extends Props{
    showOnMobile: (content: string) => void;
}



export const ShowResultOnComputer: React.FC<OnComputerProps> = ({ content, contentOnComputer, showOnMobile, finish, domain }) => {
    const restart = () => contentOnComputer('');
    const onShowOnMobile=()=>showOnMobile(content);
    onComputer.useConnectMobile({restart,onShowOnMobile,finish});
    return (
        <RenderContentForm content={content} restart={restart} finish={finish}/>
    );

};
interface ContentFormProps{
    content:string;
    restart:()=>void;
    finish:()=>void;

}


const RenderContentForm:React.FC<ContentFormProps>=({content,restart,finish})=>{
    const [expand,setExpand]=useState('decryptedContent');
    const footer=(<>
        <DarkButton onClick={restart}>Decrypt Another Content</DarkButton>
        <DarkButton onClick={finish}>Finish</DarkButton>
    </>);
    return ( <NoMobilePage title="Decrypted Content Received" footer={footer}>
        <Field>
                    <TextArea id="decryptedContent"  value={content} placeholder="Empty"
                    onFocus={()=>setExpand('decryptedContent')} readOnly={true}/>
                    <Label htmlFor="decryptedContent">Decrypted Content</Label>
                    <CopyToClipboardButton value={content}>Copy</CopyToClipboardButton>
                    <Help expand={expand} expandId="decryptedContent"  setExpand={setExpand} position={2}>
                        This decrypted content is received from your mobile app as it is.
                    </Help>
        </Field>
    </NoMobilePage>
)

};
