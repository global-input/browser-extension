import React, { useState } from 'react';

import { useMobile} from 'global-input-mobile';
import {Error,DarkButton,ConnectedInstruction,DecryptIcon,
    ShowIcon,SendIcon,FormPage} from '../../components';
interface Props {
    content: string;
    contentOnComputer: (content: string) => void;
    showOnComputer: (content: string) => void;
    domain: string;
}

export const DecryptContent: React.FC<Props> = ({ domain, content, contentOnComputer, showOnComputer }) => {
    const [errorMessage, setErrorMessage] = useState('');
    const initData = () => ({
        form: {
            title: "Mobile Decryption",
            fields: [{ ...FIELDS.content, value: content }, FIELDS.info, FIELDS.back]
        }
    });
    const mobile = useMobile(initData, true);
    const back = () => {
        contentOnComputer(content);
    }
    mobile.setOnchange(({ field }) => {
        switch (field.id) {
            case FIELDS.content.id:
                if (field.value) {
                    showOnComputer(field.value as string)
                }
                else {
                    setErrorMessage("Failed to decrypt!");
                    mobile.sendValue(FIELDS.info.id, { style: { color: "red" }, content: "Failed to decrypt!" });
                }
                break;
            case FIELDS.back.id:
                back();
                break;
        }
    });
    const footer=(<DarkButton onClick={back}>Back</DarkButton>);
    return (
        <FormPage title="Decrypting Content On your Mobile" mobile={mobile} footer={footer}>

            {errorMessage && (<Error>{errorMessage}</Error>)}
            <ConnectedInstruction mobile={mobile}>
                    The content is now sent to your mobile app for decryption.
                    On your mobile, you can press <ShowIcon/>
                    to inspect the content received. Then, press <DecryptIcon/> to start decrypting it.
                    In the next screen on your mobile, you will be presented with the decrypted content,
                    you can press <ShowIcon/> to inspect the decrypted content before pressing <SendIcon/> to send it to this application.
            </ConnectedInstruction>
        </FormPage>
    );

};

const FIELDS = {
    content: {
        id: "decryptContent",
        label: "Content",
        type: 'decrypt',
        value: ''
    },
    info: {
        id: "info",
        type: "info",
        value: "",
    },
    back: {
        id: "backToContent",
        label: "Back",
        type: "button",
        viewId: "row1"
    }
};
