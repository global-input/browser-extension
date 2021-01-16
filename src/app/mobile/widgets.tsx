import React, { useEffect } from 'react';
import styled from 'styled-components';
import {ConnectQR, PairingQR} from 'global-input-react';////global-input-react////

import {WidgetState, MobileData} from './commons';


import settingsImage from './images/settings.png';
import connectImage from './images/connect.png';
import disconnectImage from './images/disconnect.png';
import pairingImage from './images/pairing.png';

import {SettingsEditor} from './settingsEditor';



const Button = styled.button`
    text-decoration: none;
    font-size: 11px;
    border-radius: 8px;
    color: #4281BD;
    background-color: white;
    white-space: nowrap;

    padding: 10px;
    flex-direction: row;
    justify-content: center;
    align-items: center;
    border-color:#EEEEEE;
    display:flex;
    min-width:50px;

    max-width: 200px;
    margin-left:5px;
    margin-right:5px;
    box-shadow: 0px 8px 15px rgba(0, 0, 0, 0.1);
    transition: all 0.3s ease 0s;
    cursor: pointer;
    font-family: 'Roboto', sans-serif;

    &: hover{
        transform: translateY(-3px);
        box-shadow: 0 0 50px #ffff;
    }

`;

const BigButton = styled(Button)`
    border-width:0;
    font-size: 15px;
`;
const DarkButton = styled(BigButton)`
        background-color:rgb(208, 226, 247);

`;

const Container = styled.div`

        flex-direction: column;
        justify-content: flex-center;
        align-items: flex-start;
        background-color: white;
        margin: 0;
        padding:0;
        border-top-left-radius: 4px;
        border-top-right-radius: 4px;
        display: flex;
`;

const TopBar = styled.div`
        display: flex;
        border-top-left-radius: 4px;
        border-top-right-radius: 4px;
        flex-direction: row;
        align-items:flex-start;
        justify-content: space-between;
        width: 100%;
        align-items: flex-end;
        padding-top:10px;
        background-color:rgb(74, 93, 126);
`;
const Content = styled.div`
        flex-direction: column;
        justify-content: flex-center;
        align-items: center;
        margin: 0;
        padding:0;
        display: flex;
        overflow:scroll;
        background-color:white;
        width:400px;
        height:400px;
`;

 const ErrorMessage = styled.div`
        color: red;
        font-size: 11;
        padding-left: 10px;
        padding-right: 10px;
        padding-bottom: 10px;
        max-width:  350px;
        max-height: 100px;
        overflow: scroll;
`;




const TabContainer=styled.div`
    display:flex;
    flex-direction:row;
    justify-content:flex-start;
    align-items:center;
    height:100%;
    width:100%;
    border-top-left-radius: 4px;
    border-top-right-radius: 4px;
    align-items: flex-end;
`;
const TabBase=styled.div`
        border-top-left-radius: 4px;
        border-top-right-radius: 4px;
        border-width:0px;
        margin-right:10px;
        margin-left:10px;
        padding:5px;
        display:flex;
        flex-direction:column;
        justify-content:flex-start;
        align-items:center;
        width:80px;


`;
const ActiveTab=styled(TabBase)`
    background-color:white;
`;
const Tab=styled(TabBase).attrs({
    as:`button`
})`
margin-bottom:10px;
cursor:pointer;
background-color:#DDDDDD;
&: hover{
    transform: translateY(-3px);
    box-shadow: 0 0 50px #ffff;
}
`;



const TabText=styled.div`
    color:rgb(21,53,232);
    font-size:8px;
    font-size:12px;


`;


const SettingsIcon=styled.img.attrs({
    src:settingsImage,
    alt:'Settings'
})`
        display:block;

`;
const PairingIcon=styled.img.attrs({
        src:pairingImage,
        alt:'Pair'
    })`
    display:block;

    `;

const ConnectIcon=styled.img.attrs({
    src:connectImage,
    alt:'Connect'
})`


        display:block;

`;



const DisconnectIcon=styled.img.attrs({
        src:disconnectImage,
        alt:'Disconnect'
    })`
    `;

    const QRCodeContainer = styled.div`
        flex-direction: column;
        justify-content: flex-center;
        align-items: flex-start;
        margin: 0;
        padding:0;
        display: flex;
   `;


const BottomCentered=styled.div`
    font-size=12px;
    color:black;
    font-family: Georgia, Times, Serif;
    text-align:center;
    width:100%;
    color:green;

`;
export const GlobalInputAppLink=styled.a.attrs({
    href:'https://globalinput.co.uk/global-input-app/get-app',
    rel:'noopener noreferrer',
    target:'_blank'
})`
    color: blue;
`;
export const SourceLink=styled.a.attrs({
    href:'https://github.com/global-input/browser-extension',
    rel:'noopener noreferrer',
    target:'_blank'
})`
    color: white;
    font-weight: 100;
    font-family: Georgia, Times, Serif;
    font-size: 8px;
    flex:1;
    text-align:center;
    padding-bottom:10px;
    `;



interface TabProps{
        widgetState:WidgetState;
        setWidgetState:(widgetState:WidgetState)=>void;
}
const SettingsTab:React.FC<TabProps>=({widgetState,setWidgetState})=>{
    if(widgetState===WidgetState.SETTINGS){
        return (<ActiveTab>
            <SettingsIcon/>
            <TabText>Settings</TabText>
        </ActiveTab>);
    }
    else{
        return  (
        <Tab  onClick={()=>setWidgetState(WidgetState.SETTINGS)}>
                <SettingsIcon/>
                <TabText>Settings</TabText>
        </Tab>);
    }
}


const ConnectTab:React.FC<TabProps>=({widgetState,setWidgetState})=>{
    if(widgetState===WidgetState.CONNECT_QR){
        return (<ActiveTab>
            <ConnectIcon/>
            <TabText>Connect</TabText>
        </ActiveTab>);
    }
    else{
        return  (
        <Tab  onClick={()=>setWidgetState(WidgetState.CONNECT_QR)}>
                <ConnectIcon/>
                <TabText>Connect</TabText>
        </Tab>);
    }
};


const PairingTab:React.FC<TabProps>=({widgetState,setWidgetState})=>{
    if(widgetState===WidgetState.PAIRING){
        return (<ActiveTab>
            <PairingIcon/>
            <TabText>Pair</TabText>
        </ActiveTab>);
    }
    else{
        return  (
        <Tab onClick={()=>setWidgetState(WidgetState.PAIRING)}>
                <PairingIcon/>
                <TabText>Pair</TabText>
        </Tab>);
    }
};


const Tabs:React.FC<TabProps>=(props)=>(
    <TabContainer>
                <ConnectTab {...props}/>
                <SettingsTab {...props}/>
                <PairingTab  {...props}/>
                <SourceLink>Source Code</SourceLink>
    </TabContainer>
);
const ScanMessage=()=>(
    <BottomCentered>Scan with <GlobalInputAppLink>Global Input App</GlobalInputAppLink></BottomCentered>
);

interface ConnectWidgetProps{
       mobile:MobileData;
}
const DisplayConnectQR:React.FC<ConnectWidgetProps> = ({mobile}) => {
    if(mobile.widgetState!==WidgetState.CONNECT_QR)
        return null;
    if(mobile.isConnectionDenied){
        return(<ErrorMessage>You can only use one mobile app per session. Disconnect to start a new session.</ErrorMessage>);
    }
    if(mobile.isError){
        return(<ErrorMessage>{mobile.errorMessage}</ErrorMessage>);
    }
    if(!mobile.isShowWidget){
        return null;
    }
    if (mobile.isConnected) {
         return null;
    }
    return (
    <QRCodeContainer>
        <ConnectQR mobile={mobile} label="" size={350}/>
        {mobile.isReady &&(<ScanMessage/>)}
    </QRCodeContainer>
   );
};
const DisplayPairingQR:React.FC<ConnectWidgetProps> = ({mobile}) => {
    if(mobile.widgetState!==WidgetState.PAIRING)
        return null;
    if(mobile.isError){
        return(<ErrorMessage>{mobile.errorMessage}</ErrorMessage>);
    }
    return (
    <QRCodeContainer>
        <PairingQR mobile={mobile} label=""/>
        <ScanMessage/>
    </QRCodeContainer>
   );
};


export const ConnectWidget:React.FC<ConnectWidgetProps>=({mobile})=>{
        const {widgetState,setWidgetState,errorMessage,onSaveSettings,loadSettings,isConnected,isShowWidget,isConnectionDenied,
                isError}=mobile;
        if (isConnected) {
            return null;
        }
        if(!isShowWidget){
            return null;
        }
        let message =isConnectionDenied && "You can only use one mobile app per session. Disconnect to start a new session.";
        if (isError) {
                message = errorMessage;
        }

        return(
            <Container>
                <TopBar>
                    <Tabs  widgetState={widgetState} setWidgetState={setWidgetState}/>
                </TopBar>
                <Content>
                    <DisplayConnectQR mobile={mobile}/>
                    <DisplayPairingQR mobile={mobile}/>
                    {widgetState===WidgetState.SETTINGS && (<SettingsEditor saveSettings={onSaveSettings} loadSettings={loadSettings}/>)}
                </Content>
            </Container >
        );
    };



const ConnectLabel=styled.div`
     padding-left:5px;
     font-size:12px;
     @media screen and (min-width:250px){
             font-size:20px;
     }
`;

interface ButtonProps{
        label?:string;
        skin?:string;
        mobile:MobileData;
}
export const ConnectButton:React.FC<ButtonProps>=({mobile,label='Connect', skin})=>{
        const {setShowWidget, isConnected, isShowWidget}=mobile;
        if(isConnected || isShowWidget){
                return null;
        }
        if(skin==='white'){
                return (<BigButton onClick={()=>setShowWidget(true)}>{label}</BigButton>);
        }
        return (<DarkButton onClick={()=>setShowWidget(true)}>
                <ConnectIcon/>
                       <ConnectLabel>{label}</ConnectLabel>
                </DarkButton>
        );
};






export const DisconnectButton:React.FC<ButtonProps>=({mobile,label='Disconnect',skin})=>{
        const {isConnected,isConnectionDenied, isDisconnected, restart}=mobile;
        if(isConnected || isConnectionDenied || isDisconnected){
                return (<BigButton onClick={()=>restart()}>{label}</BigButton>);
        }
        else{
                return null;
        }
};


interface WhenProps{
        mobile:MobileData;
}
export const WhenConnected:React.FC<WhenProps> = ({mobile,children})=>{
     if(mobile.isConnected){
             return (<>{children}</>);
     }
     else{
             return null;
     }
}