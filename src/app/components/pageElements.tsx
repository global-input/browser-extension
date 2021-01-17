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
        width:100%;

    `;

export const PopupWindow =styled.div`
    display:flex;
    flex-direction:column;
    justify-content:flex-start;
    align-items:center;

`;


export const Content = styled.div`
        flex-direction: column;
        justify-content: flex-center;
        align-items: center;
        margin: 0;
        padding:10px;
        display: flex;
        overflow:scroll;
        background-color:white;
        min-width:300px;
        width:100%;
        max-height:400px;
`;
