import React, { useEffect, useState } from 'react';
import { useMobile } from '../utils';
import { InputWithCopy, TextButton, MessageContainer, FormContainer } from '../app-layout';


interface Props {
    content: string;
    finish: () => void;
    contentOnComputer:(content:string)=>void;
}
const ShowOnComputer: React.FC<Props> = ({ content, contentOnComputer, finish }) => {
    const mobile = useMobile({
                action: "input",
                dataType: "form",
                form: {
                    title: "Content To Encrypt",
                    fields:Object.values(FIELDS)
                }
            });
    mobile.setOnchange(({ field }) => {
        switch (field.id) {
        }
    });






    return (
        <FormContainer title="Encrypted Content">

            <InputWithCopy id="encryptedContent" readOnly={true}
                label="Encrypted Content"
                type={"textarea"}
                value={content} />
            <TextButton onClick={finish} label='Finish' />
        </FormContainer>
    );


};


const FIELDS = {
    info: {
        type: "info",
        value: 'Please operate on your computer (in the browser extension window) to copy the encrypted content into your clipboard. You can do so by pressing the "Copy" button there.'
    },
    contentOnComputer:{
        id:"contentOnComputer",
        label:"back",
        type:"button",
        viewId: "row1"
    },
    loadOnMobile: {
        id: "loadIntoMobile",
        label: "Load Into Mobile",
        type: "button",
        viewId: "row1"
    },
    finish: {
        id: "finish",
        label: "Finish",
        type: "button",
        viewId: "row1"
    },
};

export default ShowOnComputer;