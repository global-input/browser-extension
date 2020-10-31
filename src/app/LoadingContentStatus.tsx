import React, { useState, useEffect } from "react";
import  {MessageContainer,LoadingCircle} from './app-layout';
import * as chromeExtensionUtil from './chromeExtensionUtil';
import * as cacheUtil from './form-data-transfer/cacheUtil';
import {FormField} from 'global-input-react';

interface Props{
    onReceivedPageStatus:(host:string,cachedFields:FormField[]) =>void
}   
export default ({onReceivedPageStatus}:Props) => {    
    useEffect(()=>{
        const checkPageStatus = async () => {                  
            const message = await chromeExtensionUtil.checkPageStatus();
            let cachedFields:FormField[]=[];
            let domain:string="";            
            if (message && message.status === 'success' && message.host) {
                domain=message.host;
               if (message.content.key) {
                    cachedFields = cacheUtil.loadFormFields(message.host,message.content.key);                
                    if(!cachedFields){
                        cacheUtil.clearFields();                    
                    }                    
               }
               else{
                    cacheUtil.clearFields();                    
               }               
            }
            else{
                cacheUtil.clearFields();                
            }
            onReceivedPageStatus(domain,cachedFields);            
        };
        checkPageStatus();
    }, [onReceivedPageStatus]);

    return (<MessageContainer
        title="Global Input App">
            <LoadingCircle/>            
        </MessageContainer>);
        
};
