import React from 'react';
import {GlobalInputData} from '../utils';

import InputWithCopy from './input-with-copy';
import InputWithLabel from './input-with-label';
import TextButton from './text-button';
import styles from './styles';
import { FormField } from '../utils';
import { RadioButton, CheckboxButton, SelectItems } from './selectable';

export { InputWithLabel, InputWithCopy, TextButton, RadioButton, CheckboxButton, SelectItems };

export const Title:React.FC=({children})=>(
    <div style={styles.title}>{children}</div>
);

const AppTitle: React.FC = ({ children }) => {
    if (!children) {
        return null;
    }
    return (<div style={styles.appContainer.title}>{children}</div>);
};

interface DisplayErrorMessageProps {
    errorMessage: string|null;
}
export const DisplayErrorMessage: React.FC<DisplayErrorMessageProps> = ({ errorMessage,children }) => (
            <div style={styles.appContainer.errorMessage}>
                {errorMessage}
                {children}
            </div>
);
interface AppContainerProps {
    children: React.ReactNode;
    domain?: string;
    title: string;

}
export const AppContainer:React.FC<AppContainerProps> = ({ children, domain, title }) => (
<div style={styles.appContainer.content}>
        <AppTitle>{title}</AppTitle>
        <div style={styles.domain}>{domain}</div>
        {children}
    </div>
    );


export const LoadingCircle = () => (
    <div style={styles.loading}>
        <svg xmlns="http://www.w3.org/2000/svg" width="50" height="50" viewBox="0 0 50 50">
            <path fill="#C779D0" d="M25,5A20.14,20.14,0,0,1,45,22.88a2.51,2.51,0,0,0,2.49,2.26h0A2.52,2.52,0,0,0,50,22.33a25.14,25.14,0,0,0-50,0,2.52,2.52,0,0,0,2.5,2.81h0A2.51,2.51,0,0,0,5,22.88,20.14,20.14,0,0,1,25,5Z">
                <animateTransform attributeName="transform" type="rotate" from="0 25 25" to="360 25 25" dur="0.5s" repeatCount="indefinite" />
            </path>
        </svg>
    </div>
    );

const QRCodeContainer:React.FC=({children})=>(
    <div style={styles.qrCode}>
        {children}
    </div>
    );



interface BasicLayoutProps {
    title: string;
    domain?:string;
    errorMessage?:string|null;
}

export const  BasicLayout:React.FC<BasicLayoutProps> = ({ title,domain,errorMessage,children }) => (
    <AppContainer title={title} domain={domain}>
        {errorMessage?(<DisplayErrorMessage errorMessage={errorMessage}/>):children}
    </AppContainer>
);
/**
 * Only when the mobile connected and there isn't any error in both mobile and errorMessage passed in, then the children will be displayed
 *
 */
interface ControlProps extends BasicLayoutProps{
    mobile:GlobalInputData;
}
export const  ControlLayout:React.FC<ControlProps> = ({ title,errorMessage,mobile,domain,children }) =>  (
    <AppContainer title={title} domain={domain}>
        <mobile.ConnectQR container={QRCodeContainer}/>
        {(errorMessage || mobile.isError) ?(<DisplayErrorMessage errorMessage={errorMessage?errorMessage:mobile.errorMessage}/>):(mobile.isConnected && children)}
    </AppContainer>
);


interface MessageProps {
    title?: string;
}

export const MessageContainer:React.FC<MessageProps> = ({ children, title }) => (
<div style={styles.message.container}>
    {title && (<Title>{title}</Title>)}
    <div style={styles.message.text}>
        {children}
    </div>
</div>
);


interface FormContainerProps{
    domain?:string;
    title?:string;
}
export const FormContainer: React.FC<FormContainerProps> = ({ children, title }) => {
    return (<div style={styles.form.container}>
        {title && (<Title>{title}</Title>)}
        <div style={styles.form.fields}>
            {children}
        </div>
    </div>);
};


interface DisplayInputCopyFieldProps {
    field: FormField;
    hideValue: boolean;
    onChange?: (value: string, id?: string) => void;
    onCopied: () => void;
}

export const DisplayInputCopyField:React.FC<DisplayInputCopyFieldProps> = ({ field, hideValue, onChange, onCopied }) => {
    var fieldType = "text";
    if (field.nLines && field.nLines > 1) {
        fieldType = "textarea";
    }
    if (hideValue) {
        fieldType = "password";
    }
    let value = field.value as string;
    if (!value) {
        value = '';
    }
    return (
        <InputWithCopy label={field.label} id={field.id} type={fieldType}
            value={value} onCopied={onCopied}
            onChange={onChange} />
    );
};






export const FormFooter: React.FC = ({ children }) => (
    <div style={styles.form.footer}>
        {children}
    </div>
);
