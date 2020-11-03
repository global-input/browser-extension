import React,{useState} from 'react';
import { BasicLayout, FormContainer, InputWithLabel,FormFooter,TextButton,MessageContainer,MessageLink} from '../app-layout';
interface Props{
    back:()=>void;
}
const ConnectionSettings:React.FC<Props> =()=>{
    const [url,setURL]=useState('');
    const [apikey,setApikey]=useState('');
    const back=()=>{};
    const onSave=()=>{
       // appSettings.saveSettings(settings);
        //toMobileIntegration();
    };
    return (
    <BasicLayout title="Connection Settings">
         <FormContainer>
            <InputWithLabel label="Proxy URL" id="url"
                onChange={setURL}
                value={url}/>
            <InputWithLabel label="API Key" id="apikey"
                onChange={setApikey}
                value={apikey}/>
            <FormFooter>
                <TextButton onClick={back} label='Cancel'/>
                <TextButton onClick={onSave} label='Save'/>
            </FormFooter>
         <MessageContainer>
    The proxy url points to a WebSocket server that relays encrypted messages between your browser and your mobile app.
    The end-to-end encryption that uses a dynamically generated encryption key for each session ensures that only your mobile app and your browser extension can decrypt the messages.
    You may also install your own proxy server by downloading the source code from
    <MessageLink href="https://github.com/global-input/global-input-node">GitHub</MessageLink>
</MessageContainer>


</FormContainer>
    </BasicLayout>
   )

}

export default ConnectionSettings;