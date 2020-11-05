import React,{useState,useCallback} from 'react';
import { BasicLayout, FormContainer, InputWithLabel,FormFooter,TextButton,MessageContainer,MessageLink} from '../app-layout';
import {loadConnectionSettings,saveConnectionSettings} from '../storage';
interface Props{
    back:()=>void;
}
const ConnectionSettings:React.FC<Props> =({back})=>{
    const [setting,setSettings]=useState(()=>loadConnectionSettings());
    const onSave=()=>{
       saveConnectionSettings(setting);
       back();
    };
    const onURLChange=useCallback((url:string)=>setSettings(setting=>({...setting,url})),[]);
    const onAPIKey=useCallback((apikey:string)=>setSettings(setting=>({...setting,apikey})),[]);
    const url=setting.url?setting.url:'';
    const apikey=setting.apikey?setting.apikey:'';
    return (
    <BasicLayout title="Connection Settings">
         <FormContainer>
            <InputWithLabel label="Proxy URL" id="url"
                onChange={onURLChange}
                value={url}/>
            <InputWithLabel label="API Key" id="apikey"
                onChange={onAPIKey}
                value={apikey}/>
            <FormFooter>
                <TextButton onClick={back} label='Cancel'/>
                <TextButton onClick={onSave} label='Save'/>
            </FormFooter>
         <MessageContainer>
    You can use this configuration to use your own <MessageLink href="https://github.com/global-input/global-input-node">WebSocket Proxy Server</MessageLink>
    that relays encrypted messages between your browser extension and your mobile app, and the end-to-end encryption ensures that the messages are
    not visible to the server, meaning that you can install it in an insecure environment.

</MessageContainer>


</FormContainer>
    </BasicLayout>
   )

};




export default ConnectionSettings;