import React, { useState, useEffect, useCallback } from 'react';
import { TextButton, MessageContainer, DisplayErrorMessage, LoadingCircle, ControlLayout } from '../app-layout';
import { useMobile } from '../mobile';

import * as rules from './rules';
import { useControl } from './controles';


interface Props {
    back: () => void;
    domain: string;
    form: rules.FormRule;
    editRule: () => void;
    loadRule: () => void;
}


const PageControl: React.FC<Props> = ({ back, domain, form, editRule, loadRule }) => {
    const { mobile} = useControl({ back, domain, form, editRule, loadRule })
    return (
        <ControlLayout title="Page Control" mobile={mobile}>
            <MessageContainer>
                You can use your mobile to operate on the page.
            </MessageContainer>
        </ControlLayout>
    )
}


export default PageControl;