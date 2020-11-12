import React, { useCallback } from 'react';
import * as globalInput from 'global-input-react';////global-input-react////

////main////

import * as storage from '../storage';

import { AppContainer, FormFooter, TextButton, QRCodeContainer, DisplayErrorMessage, MessageContainer } from '../app-layout';

interface ControlledContainerProps {
    domain: string;
    title: string;
    notConnected?: React.ReactNode;
    errorMessage?: string;
}
interface MobileInputData extends globalInput.GlobalInputData {
    ControlledContainer: React.FC<ControlledContainerProps>;
    pairing: React.ReactNode;
}
export const useMobile = (initData: globalInput.InitData | (() => globalInput.InitData)): MobileInputData => {
    const connectionSettings = storage.loadConnectionSettings();
    const options: globalInput.ConnectOptions = {
        url: connectionSettings.url,////use your own server"
        apikey: connectionSettings.apikey,
        securityGroup: connectionSettings.securityGroup
    };
    const mobile = globalInput.useGlobalInputApp({ initData, options, codeAES: connectionSettings.codeKey });

    ////dev-test codeData

    const pairing = (<QRCodeContainer>
        <mobile.PairingQR />
    </QRCodeContainer>);


    const ControlledContainer: React.FC<ControlledContainerProps> = useCallback(({ domain, title, notConnected, errorMessage, children }) => (
        <AppContainer title={title} domain={domain}>
            {mobile.isReady && (<QRCodeContainer><mobile.ConnectQR /></QRCodeContainer>)}
            {(mobile.isError || errorMessage) ? (<DisplayErrorMessage errorMessage={errorMessage ? errorMessage : mobile.errorMessage} />) : (mobile.isConnected && children)}
            {(!mobile.isConnected) && notConnected}
            {mobile.isConnected && (<FormFooter>
                <TextButton onClick={mobile.disconnect} label="Disconnect" />
            </FormFooter>)}
            {mobile.isConnectionDenied && (
                <FormFooter>
                    <MessageContainer>A different mobile app instance is trying to connect. Press Disconnect button and tray again</MessageContainer>
                    <TextButton onClick={mobile.disconnect} label="Disconnect" />
                </FormFooter>
            )}
        </AppContainer>
        // eslint-disable-next-line react-hooks/exhaustive-deps
    ), [mobile.isConnectionDenied, mobile.isError, mobile.isConnected, mobile.isReady, mobile.disconnect, mobile.ConnectQR, mobile.errorMessage]);


    return { ...mobile, ControlledContainer, pairing };
};

export type { FormField, FieldValue } from 'global-input-react';////global-input-react////
