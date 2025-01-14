import React from 'react';
import styled from 'styled-components';
import {WhenConnected} from 'global-input-mobile';
import type {MobileData} from 'global-input-mobile';

export const TopBar = styled.div`
        display: flex;
        border-top-left-radius: 4px;
        border-top-right-radius: 4px;
        flex-direction: row;
        align-items:center;
        justify-content: center;
        width: 100%;
        align-items: center;
        background-color:rgb(74, 93, 126);
        color:white;
        padding-top:10px;
        padding-bottom:10px;
`;




export const AppTitle=styled.div`
    display: flex;
    flex-direction: row;
    justify-content: center;
    text-align: center;
    font-size: 12px;
    color: white;
    margin-left:10px;
    font-family: Georgia, Times, Serif;
},`;

export const SourceLinkElement=styled.a`
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
   @media print{
       display:none;
   }
    `;

export const AppContainerElement =styled.div`
    display:flex;
    flex-direction:column;
    justify-content:flex-start;
    align-items:center;
    min-height:100vh;
    width:100%;
    backgroundColor: rgb(219,240,240);
`;


export const AppContent=styled.div`
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    align-items: flex-start;

`;


export const AppTitleSection=styled.div`
   display:block;
   padding-top:0;
   @media screen and (min-height:340px){
    padding-top:10px;
   }
   @media screen and (min-height:500px){
    padding-top:40px;
   }
`;


export const Title=styled.div`
    font-size: 12px;
    color: #445566;
    align-self:flex-start;
    font-family: Georgia, Times, Serif;
    font-size:20px;
    margin-top:10px;
    margin-bottom:10px;
`;

export const FormTitle=styled.div`
    font-size: 10px;
    color: #445566;
    align-self:flex-start;
    font-family: Georgia, Times, Serif;
    @media screen and (min-height:150px){
        font-size:12px;
    }
    @media screen and (min-height:400px){
        font-size:16px;
        margin-bottom:10px;
    }
    @media print{
        display:none;
    }
`;




export const MoreInfo = styled.div`
    font-size: 14px;
    align-self:flex-start;
`;
interface InstructionProps{
    center?:boolean;
}
export const Instruction=styled.div<InstructionProps>`
    font-size: 10px;
    align-self:${props=>props.center?'center':'flex-start'};
    font-size: 16px;
`;



interface ConnectedInstructionProps{
    mobile:MobileData;
    center?:boolean;
    children:React.ReactNode;
}


export const ConnectedInstruction:React.FC<ConnectedInstructionProps>=({children, mobile, center=false})=>(

<WhenConnected mobile={mobile}>
                <Instruction center={center}>
                    {children}
                </Instruction>
            </WhenConnected>

);


export const Error = styled.div`
        color: red;
        font-size: 11;
        padding-left: 10px;
        padding-right: 10px;
        padding-bottom: 10px;
        max-width:  350px;
        max-height: 100px;
        margin-top:10px;
        overflow: scroll;
`;

export const ConnectContainer=styled.div`
    display:flex;
    flex-direction:column;

    min-width:50px;

    padding-bottom:30px;
`;