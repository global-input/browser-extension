import React, { useEffect } from 'react';
import { PopupWindow, TopBar,Content,Footer,DarkButton, Spinner,Domain } from '../../components';
import * as rules from '../rules';



interface Props {
    back: () => void;
    domain: string;
    editRule: () => void;
    processRule: (rule: rules.PageRule) => void;
}

export const LoadRules: React.FC<Props> = ({ back, domain, editRule, processRule }) => {
    return (
        <PopupWindow>
            <TopBar>Page Control</TopBar>
            <Content>
                <Domain>{domain}</Domain>

                <Spinner/>
            </Content>
            <Footer>
                <DarkButton onClick={back} >Back</DarkButton>
                <DarkButton onClick={editRule}>Edit Rule</DarkButton>
            </Footer>
        </PopupWindow>
    );
}
