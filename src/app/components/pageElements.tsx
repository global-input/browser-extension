import React from 'react';
import styled from 'styled-components';
import {Field,SourceLinkElement,AppContainerElement,AppTitleSection,AppTitle,AppBody,AppContent} from '../common-elements';


export const Domain=styled.div`
    color: #153E85;
    font-weight: 100;
    font-family: Georgia, Times, Serif;
    font-size: 8px;
    float:right;

    @media screen and (min-height:150px){
        font-size:12px;
    }
    @media screen and (min-height:400px){
        font-size:16px;
    }
    `;

interface AppContainerProps{
    domain:string;
    title:string;
}
    export  const AppContainer:React.FC<AppContainerProps>=({domain, title, children})=>(
        <AppContainerElement>
                <AppTitleSection>
                    <AppTitle>{title}</AppTitle>
                    <Domain>{domain}</Domain>
                </AppTitleSection>
                <AppBody>
                    <AppContent>
                    {children}
                    </AppContent>

                </AppBody>
        </AppContainerElement>
    );

    export const DomainField=styled(Field)`
        max-width:300px;

    `;

export const PopupWindow =styled.div`
    display:flex;
    flex-direction:column;
    justify-content:flex-start;
    align-items:center;
`;
