import React from 'react';
import styled from 'styled-components';

interface ExpandProp{
    expand?:boolean;
    position?:number;
    children?:React.ReactNode;
}
const ExpandIcon =styled.div<ExpandProp>`
    box-sizing: border-box;
    position: relative;
    display: inline-block;

    background-color:white;
    cursor:pointer;


    width: 22px;
    height: 22px;
    border: 2px solid;
    border-radius: 100px;
    top:-5px;
    color:rgb(77,104,206);
    margin-right:5px;
    transform:${props=>props.expand?'rotate(90deg)':'rotate(0deg)'};
    &::after {
        content: "";
        display: block;
        box-sizing: border-box;
        position: absolute;
        width: 6px;
        height: 6px;
        border-bottom: 2px solid;
        border-right: 2px solid;
        transform: rotate(-45deg);
        left: 5px;
        top: 6px;
    }
    position:relative;
    top:0px;

`;

const HelpContainer1=styled.div`
 display:flex;
 flex-direction:column;
 justify-content:flex-start;
 align-items:flex-start;
 position:relative;
 width:90%;
`;
const HelpContainer2=styled(HelpContainer1)`
    top:-30px;

`;
const HelpContainer3=styled(HelpContainer1)`

`;
const HelpContainer4=styled(HelpContainer1)`

`;
const HelpContainer5=styled(HelpContainer1)`

`;
const HelpContainer:React.FC<ExpandProp>=({position=1,children})=>{
    if(position===2){
        return (<HelpContainer2>{children}</HelpContainer2>)
    }
    else if(position===3){
        return (<HelpContainer3>{children}</HelpContainer3>)
    }
    else if(position===4){
        return (<HelpContainer4>{children}</HelpContainer4>)
    }
    else if(position===5){
        return (<HelpContainer5>{children}</HelpContainer5>)
    }

    else{
        return (<HelpContainer1>{children}</HelpContainer1>)
    }
}

const HelpContent=styled.div<ExpandProp>`
font-family: Avenir;
    color: rgb(53,116,230);
    white-space: wrap;
    font-size: 12px;
    display:${props=>props.expand?'inline':'none'};
    position:relative;
    top:-5px;
    left:20px;
    width:90%;
`;

interface Prop{
    expandId:string;
    expand:string;
    setExpand:(expand:string)=>void;
    position?:number;
    children?:React.ReactNode;
}
export const Help:React.FC<Prop>=({children,expandId, expand,setExpand, position=1})=>{
    const isExpanded=expand===expandId;
    const toggle=()=>setExpand(isExpanded?'':expandId);
    return (
    <HelpContainer position={position}>
            <ExpandIcon expand={isExpanded} onClick={toggle}/>
            <HelpContent expand={isExpanded}>
                {children}
            </HelpContent>
    </HelpContainer>
    );
};
