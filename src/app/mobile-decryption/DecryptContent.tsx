import React, { useState } from 'react';
import { useMobile } from '../mobile';
import { MessageContainer, FormContainer, ControlLayout } from '../app-layout';

interface Props {
    content: string;
    contentOnComputer: (content: string) => void;
    showOnComputer: (content: string) => void;
}

const DecryptContent: React.FC<Props> = ({ content, contentOnComputer, showOnComputer }) => {
    const [errorMessage, setErrorMessage] = useState('');
    const mobile = useMobile({
        action: "input",
        dataType: "form",
        form: {
            title: "Mobile Decryption",
            fields: [{ ...FIELDS.content, value: content }, FIELDS.info, FIELDS.back]
        }
    });

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
                contentOnComputer(content);
                break;
        }
    });
    return (
        <ControlLayout title="Mobile Decryption" mobile={mobile} errorMessage={errorMessage}>
            <FormContainer>
                <MessageContainer title="Decrypting Content">
                    Follow the instruction on your mobile to decrypt content.
            </MessageContainer>
            </FormContainer>

        </ControlLayout>
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

export default DecryptContent;
