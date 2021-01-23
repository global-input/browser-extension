import React from 'react';
import styled from 'styled-components';
import {Field,TopBar,AppTitle,AppContent,Title,Footer,Form} from '../common-elements';
import {ConnectWidget,WhenConnected} from '../mobile';
import type {MobileData} from '../mobile';


export const Domain=styled.div`
    color: #153E85;
    font-weight: 100;
    font-family: Georgia, Times, Serif;
    font-size: 12px;
    width:100%;
    text-align:right;
    margin-top:10px;
    margin-bottom:10px;
    `;



    export const DomainField=styled(Field)`
        width:100%;

    `;

export const PopupWindow =styled.div`
    display:flex;
    flex-direction:column;
    justify-content:flex-start;
    align-items:center;
    width:100%;
    height:100%;
`;


export const Content = styled.div`
        flex-direction: column;
        justify-content: center;
        align-items: center;
        margin: 0;
        display: flex;
        overflow:scroll;
        background-color:white;
        height:100%;
        min-height:200px;
        min-width:400px;
        padding:10px;
`;

export const MessageContent=styled.div`
        flex-direction: column;
        justify-content: flex-start;
        align-items: flex-start;
        margin-top:80px;
`;
export const Message=styled.div`
        color: #153E85;
        font-weight: 100;
        font-family: Georgia, Times, Serif;
        font-size: 14px;
        margin-bottom:10px;
        max-width:400px;

`;

interface BasicPageProps{
    domain?:string;
    title:string;
    footer?:React.ReactNode;
}
export const NoMobilePage:React.FC<BasicPageProps>=({domain,title, children,footer})=>(

    <PopupWindow>
        <TopBar>
            <AppTitle>Global Input App</AppTitle>
        </TopBar>
        <Content>
                <AppContent>
                    {domain && (<Domain>{domain}</Domain>)}
                <Title>{title}</Title>
                {children}
                {footer&&(<Footer>{Footer}</Footer>)}
                </AppContent>
        </Content>
    </PopupWindow>

);


interface OnlyConnectedProps{
    mobile:MobileData;
    domain?:string;
    title:string;
    footer?:React.ReactNode;
}
export const ConnectedPage:React.FC<OnlyConnectedProps>=({mobile,domain, title, children,footer})=>(
    <PopupWindow>
        <ConnectWidget mobile={mobile} />
        <WhenConnected mobile={mobile}>
            <TopBar>
                <AppTitle>Global Input App</AppTitle>
            </TopBar>
            <Content>
               <AppContent>
                  <Domain>{domain}</Domain>
                  <Title>{title}</Title>
                  {children}
                 {footer && (<Footer>{footer}</Footer>)}
               </AppContent>
            </Content>
        </WhenConnected>
</PopupWindow>
);

export const FormPage:React.FC<OnlyConnectedProps>=({mobile,domain, title, children,footer})=>(

<PopupWindow>
            <ConnectWidget mobile={mobile}/>
            <TopBar>
                    <AppTitle>Global Input App</AppTitle>
            </TopBar>


            <Content>
                <Title>{title}</Title>
                {domain && (<Domain>{domain}</Domain>)}
                <Form>
                        {children}
                        {footer && (<Footer>{footer}</Footer>)}
                </Form>
        </Content>
        </PopupWindow>);