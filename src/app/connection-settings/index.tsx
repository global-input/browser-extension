import React, { useState, useCallback } from 'react';
import { BasicLayout, FormContainer, InputWithLabel, FormFooter, TextButton, MessageContainer, MessageLink } from '../app-layout';
import { loadConnectionSettings, saveConnectionSettings } from '../storage';

import {useMobile} from '../mobile';
interface Props {
    back: () => void;
}

const ConnectionSettings: React.FC<Props> = ({ back }) => {
    const [setting, setSettings] = useState(() => loadConnectionSettings());
    const mobile = useMobile({
        action: "input",
        dataType: "form",
        form: {
            title: "Connecting Settings",
            fields: Object.values(FIELDS)
        }
    });
    const {disconnect}=mobile;
    const onSave = useCallback(() => {
        saveConnectionSettings(setting);
        disconnect();
        back();
    },[disconnect,back,setting]);
    const onURLChange = useCallback((url: string) => setSettings(setting => ({ ...setting, url })), []);
    const onAPIKey = useCallback((apikey: string) => setSettings(setting => ({ ...setting, apikey })), []);
    const onSecurityGroupChanged = useCallback((securityGroup: string) => setSettings(setting => ({ ...setting, securityGroup })), []);
    const onCodeKeyChanged = useCallback((codeAES: string) => setSettings(setting => ({ ...setting, codeAES })), []);
    const url = setting.url ? setting.url : '';
    const apikey = setting.apikey ? setting.apikey : '';
    const securityGroup = setting.securityGroup ? setting.securityGroup : '';
    const codeKey = setting.codeAES ? setting.codeAES : '';
    return (
        <BasicLayout title="Connection Settings">
            <FormContainer>
                <InputWithLabel label="Proxy URL" id="url"
                    onChange={onURLChange}
                    value={url} />
                <InputWithLabel label="API Key" id="apikey"
                    onChange={onAPIKey}
                    value={apikey} />
                <InputWithLabel label="Security Group" id="securityGroup"
                    onChange={onSecurityGroupChanged}
                    value={securityGroup} />
                <InputWithLabel label="Code Key" id="codeKey"
                    onChange={onCodeKeyChanged}
                    value={codeKey} />
                <FormFooter>
                    <TextButton onClick={back} label='Cancel' />
                    <TextButton onClick={onSave} label='Save' />
                </FormFooter>
                <MessageContainer>
    Proxy URL and the API Key are used when you use your own <MessageLink href="https://github.com/global-input/global-input-node">WebSocket Proxy Server</MessageLink>
    that provides connectivity between your mobile app and your browser extension, allowing them to exchange encrypted messages. The end-to-end encryption ensures that the messages are
    readable only to your mobile app and your browser extension. This means that you can install <MessageLink href="https://github.com/global-input/global-input-node">WebSocket Proxy Server</MessageLink> in an insecure environment.
    The Security Group is used for your applications to identify incoming connections in the same way that API Key is used for server applications to identify incoming connections. The Code Key is used to encrypt the content of the QR Code being displayed for mobile apps to scan to connect to your extension.
</MessageContainer>


            </FormContainer>
        </BasicLayout>
    )

};



const FIELDS = {
    url: {
        id: "proxy-url",
        type: 'text',
        value: '',
    },
    apikey: {
        id: "apikey",
        type: 'text',
        value: '',
    },
    securityGroup: {
        id: "securityGroup",
        type: 'text',
        value: '',
    },
    codeKey: {
        id: "codeKey",
        type: 'text',
        value: '',
    },
    back: {
        id: 'back',
        type: 'button',
        label: 'Back',
        viewId: "row1"
    },
    cancel: {
        id: 'cancel',
        type: 'button',
        label: 'Cancel',
        viewId: "row1"
    },


}
export default ConnectionSettings;