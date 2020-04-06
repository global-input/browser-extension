import React, {useEffect, useRef} from "react";
import InputWithCopy from './input-with-copy';
import InputWithLabel from './input-with-label';
import TextButton from './text-button';
import {SelectionContainer, RadioButton,CheckboxButton,SelectItems} from './selectable';
import styles from './styles';

export {SelectionContainer, SelectItems,RadioButton,CheckboxButton,InputWithCopy};

export {TextButton,InputWithLabel};



export const AppTitle=({children})=>{
    if(!children){
        return null;
    }
    return (<div style={styles.title}>{children}</div>);
}
    

export const DisplayErrorMessage=({errorMessage})=>{    
    if(!errorMessage){
        return null;
    }
    else{
        let message=errorMessage;
        if(typeof message === 'object'){
            message=JSON.stringify(errorMessage);
        }
        
        return(
        <div style={styles.appContainer.errorMessage}>
                        {message} 
        </div>
        );
    }
}

export const MobileIntegrationContainer = ({globalInputApp,children,toSettings,toMobileIntegrationHome})=>{    
    const {connectionMessage, WhenConnected,WhenWaiting, WhenError,errorMessage,WhenDisconnected}=globalInputApp;  
    
    const ExtensionFooter=()=>(        
            <div style={styles.appContainer.footer}>
                <a href="#" onClick={evt=>{toSettings();return false;}}>Settings</a>
                <a href="https://github.com/global-input/browser-extension" target="_blank">Source Code On GitHub</a>
            </div>
        );

    return (
        <div style={styles.appContainer.content}>                                
            <WhenWaiting>
                <AppTitle>Global Input App</AppTitle>                 
                <div style={styles.appContainer.connectionMessage}>
                        {connectionMessage}
                </div>
                <ExtensionFooter/>                
            </WhenWaiting>
            <WhenError>
                <AppTitle>Global Input App</AppTitle> 
                <DisplayErrorMessage    errorMessage={errorMessage}/>                
                <ExtensionFooter/>
            </WhenError>
                
            <WhenDisconnected>
                <AppTitle>Global Input App</AppTitle>
                <div style={styles.appContainer.message}>Mobile Disconnected. <a href="#" onClick={evt=>{toMobileIntegrationHome();return false;}}>Reconnect</a>.
                </div> 
                <ExtensionFooter/>
            </WhenDisconnected>
            <WhenConnected>
                {children}
            </WhenConnected>
        </div>
    );
};






export const MessageContainer = ({children,title})=>{

    return (<div style={styles.message.container}>
                <AppTitle>{title}</AppTitle>
                <div style={styles.message.text}>
                        {children}
                </div>
                
        
        </div>);

};
export const MessageLink=({children, href})=>{
    return (<a href={href} style={styles.message.alink} rel='noreferrer noopener' target='_blank'>{children}</a>);

}



export const FormContainer = ({children,domain,title})=>{

    return (<div style={styles.form.container}>
                <AppTitle>{title}</AppTitle>
                <div style={styles.domain}>{domain}</div>
                <div style={styles.form.fields}>
                        {children}
                </div>
                
        
        </div>);

};


export const DisplayInputCopyField = ({field,hideValue,onChange,onCopied})=>{
    var fieldType="text";
    if(field.nLines && field.nLines>1){
        fieldType="textarea";
    }          
    if(hideValue){
      fieldType="password";
    }
    let value=field.value;
    if(!value){
         value='';
    }
    return(       
        <InputWithCopy label={field.label} id={field.id} type={fieldType}
           value={value}  onCopied={onCopied} secret={true}
           onChange={onChange}/>    
      );
};

export const FormFooter=({children})=>(
    <div style={styles.form.footer}>
        {children}
    </div>
);




