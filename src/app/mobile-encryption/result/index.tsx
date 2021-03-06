import React,{useState} from 'react';
import * as onComputer from './mobile-ui/onComputer';
import * as onMobile from './mobile-ui/onMobile';

import {DarkButton,NoMobilePage, Field,TextArea, Label,CopyToClipboardButton, Help} from '../../components';
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
    const [expand,setExpand]=useState('encryptedContent');
    const footer=(
        <>
            <DarkButton onClick={restart}>Encrypt Another Content</DarkButton>
            <DarkButton onClick={finish}>Finish</DarkButton>
        </>
    )
    return (
    <NoMobilePage title="Encrypted Content Received" footer={footer}>
        <Field>
                    <TextArea id="encryptedContent"  value={content} placeholder="Empty"
                    onFocus={()=>setExpand('encryptedContent')} readOnly={true}/>

                    <Label htmlFor="encryptedContent">Encrypted Content</Label>
                    <CopyToClipboardButton value={content}>Copy</CopyToClipboardButton>
                    <Help expandId='encryptedContent' expand={expand} setExpand={setExpand} position={2}>
                    You can now store this encrypted content into a storage you prefer with the confidence that only you can decrypt using your mobile.
                    Note that considering you may loose your phone, you should export the encryption key used in the encryption as an encrypted QR code.
                    Alternatively, you can use another mobile to scan the encryption key to have a backup.


                    </Help>

        </Field>


    </NoMobilePage>
)

};
