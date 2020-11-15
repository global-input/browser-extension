import React, { useCallback } from 'react';
import * as globalInput from 'global-input-react';////global-input-react////

////main////

import * as storage from '../storage';

import { AppContainer, RowCenter, FormContainer, TextButton, QRCodeContainer, DisplayErrorMessage, MessageContainer } from '../app-layout';

interface ControlledContainerProps {
    domain: string;
    title: string;
    notConnected?: React.ReactNode;
    errorMessage?: string;
}
interface MobileInputData extends globalInput.GlobalInputData {
    ControlledContainer: React.FC<ControlledContainerProps>;
    pairing: React.ReactNode;
    disconnectButton: React.ReactNode;
    sendFormFields: (title: string, fields: globalInput.FormField[]) => void;
    setOnFieldChange: (onFieldChange: (field: globalInput.FormField) => void) => void
}
export const useMobile = (title: string, fields: globalInput.FormField[] | (() => globalInput.FormField[]), domain?: string, formId?: string,): MobileInputData => {
    const connectionSettings = storage.loadConnectionSettings();
    const options: globalInput.ConnectOptions = {
        url: connectionSettings.url,////use your own server"
        apikey: connectionSettings.apikey,
        securityGroup: connectionSettings.securityGroup
    };
    if (typeof fields === 'function') {
        fields = fields();
    }
    const initData: globalInput.InitData = {
        action: "input",
        dataType: "form",
        form: {
            title,
            fields
        }

    };
    if (formId) {
        initData.form.id = formId;
    }
    else {
        const formIdWithDomain = computeFormId(fields, domain);
        if (formIdWithDomain) {
            initData.form.id = formIdWithDomain;
        }
    }
    if (domain) {
        initData.form.label = domain;
    }


    const mobile = globalInput.useGlobalInputApp({
        initData, options, codeAES: connectionSettings.codeKey
    });

    const sendFormFields = useCallback((title: string, fields: globalInput.FormField[]) => {
        mobile.sendInitData({
            action: "input",
            dataType: "form",
            form: {
                title,
                fields
            }
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [mobile.sendInitData]);

    const setOnFieldChange = useCallback((onFieldChange: (field: globalInput.FormField) => void) => {
        mobile.setOnchange(({ field }) => {
            onFieldChange(field);
        })
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [mobile.setOnchange]);

    ////dev-test codeData

    const pairing = (<QRCodeContainer>
        <mobile.PairingQR />
    </QRCodeContainer>);

    // eslint-disable-next-line react-hooks/exhaustive-deps
    const restart = useCallback(() => mobile.restart(), [mobile.restart]);

    const disconnectButton = (<TextButton onClick={restart} label="Disconnect" />);


    const ControlledContainer: React.FC<ControlledContainerProps> = useCallback(({ domain, title, notConnected, errorMessage, children }) => (
        <AppContainer title={title} domain={domain}>
            {mobile.isConnectionDenied && (
                <FormContainer>
                    <MessageContainer>You can only use one mobile app per session. Disconnect to start a new session.</MessageContainer>
                    <RowCenter>

                        {disconnectButton}
                    </RowCenter>
                </FormContainer>

            )}
            {mobile.isReady && (<QRCodeContainer><mobile.ConnectQR /></QRCodeContainer>)}
            {(mobile.isError || errorMessage) ? (<DisplayErrorMessage errorMessage={errorMessage ? errorMessage : mobile.errorMessage} />) : (mobile.isConnected && children)}
            {(!mobile.isConnected) && notConnected}

        </AppContainer>
        // eslint-disable-next-line react-hooks/exhaustive-deps
    ), [mobile.isConnectionDenied, mobile.isError, mobile.isConnected, mobile.isReady, mobile.disconnect, mobile.ConnectQR, mobile.errorMessage]);

    return { ...mobile, ControlledContainer, pairing, disconnectButton, sendFormFields, setOnFieldChange };
};

export type { FormField, FieldValue } from 'global-input-react';////global-input-react////


const computeFormId = (fields: globalInput.FormField[], domain?: string) => {
    if ((!domain) || (!fields) || (!fields.length)) {
        return null;
    }
    const textFields = fields.filter(f => {
        if ((!f.type) || f.type === 'text') {
            if (f.nLines && f.nLines > 1) {
                return false;
            }
            return true;
        }
        return false;
    });
    if (!textFields.length) {
        return null;
    }
    return `###${textFields[0].id}###@${domain}`;
}