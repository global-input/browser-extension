import React from 'react';
import styled from 'styled-components';
import {Field,TopBar,AppTitle,Title,Footer,Form} from '../common-elements';
import {ConnectWidget,WhenConnected} from 'global-input-mobile';
import type {MobileData} from 'global-input-mobile';

const minWidth=300;
const maxWidth=500;
const maxHeight=550;

export const PopupWindow =styled.div`
    display:flex;
    flex-direction:column;
    justify-content:flex-start;
    align-items:center;
    width:100%;
    height:100%;
    min-width:${minWidth}px;
    max-width:${maxWidth}px;
    max-height:${maxHeight}px;        
`;





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



export const Content = styled.div`
        flex-direction: column;
        justify-content: flex-start;
        align-items: center;
        margin: 0;
        display: flex;
        overflow:scroll;
        background-color:white;
        height:100%;
        width:94%;
        padding:5px;
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
export const Important=styled(Message)`
font-weight: 200;
margin-bottom:20px;
margin-top:20px;
`;

interface NoMobilePageProps{
    domain?:string;
    title:string;
    footer?:React.ReactNode;
    children?:React.ReactNode;
}
export const NoMobilePage:React.FC<NoMobilePageProps>=({domain,title, children,footer})=>(

    <PopupWindow>
        <TopBar>
            <AppTitle>Global Input App</AppTitle>
        </TopBar>
        <Content>

                <Title>{title}</Title>
                {domain && (<Domain>{domain}</Domain>)}
                {children}
                {footer&&(<Footer>{footer}</Footer>)}

        </Content>
    </PopupWindow>

);


interface OnlyConnectedProps{
    mobile:MobileData;
    domain?:string;
    title:string;
    footer?:React.ReactNode;
    children?:React.ReactNode;


}
export const ConnectedPage:React.FC<OnlyConnectedProps>=({mobile,domain, title, children,footer})=>(
    <PopupWindow>        
        <ConnectWidget mobile={mobile} />
        <WhenConnected mobile={mobile}>
            <TopBar>
                <AppTitle>Global Input App</AppTitle>
            </TopBar>
            <Content>
                  <Domain>{domain}</Domain>
                  <Title>{title}</Title>
                  {children}
                 {footer && (<Footer>{footer}</Footer>)}
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