import {generateRandomString, encrypt, decrypt} from 'global-input-react';

import {FormField} from 'global-input-react';

export const generateEncryptionKey=()=>{
    return generateRandomString(20);    
}

const getVariableNames=(domain:string)=>{        
    return {
        cacheFields:'extension.content.cacheFields.'+domain,
        cachedTime:'extension.content.cachedTime.'+domain
    }

};

export const clearFields= (domain?:string)=>{
    try{
            if(domain){
                const variableNames=getVariableNames(domain);
                localStorage.removeItem(variableNames.cacheFields);
                localStorage.removeItem(variableNames.cachedTime);    
                return;
            }
            const prefix= getVariableNames('');             
            const keys=Object.keys(localStorage);
            for (let i=0; i<keys.length;i++){
                const key=keys[i];            
                if(key.startsWith(prefix.cacheFields) || key.startsWith(prefix.cachedTime)){
                        localStorage.removeItem(key);
                }
            }    
    }
    catch(error){
        console.error("failed to clear the cache:"+error);
        console.error(error.stack);
    }
}


const cacheTTL=60000;




export const cacheIfMultipleFields = (domain?:string,formFields?:FormField[])=>{    
        if(!domain || !formFields){
            return null;
        }
        const numberOfNotEmptyFields=formFields.reduce((count,f)=>f.value?count+1:count,0);
        if(numberOfNotEmptyFields<2){
                return null;
        }
        const key=generateEncryptionKey();        
        const contentBlob=JSON.stringify(formFields);
        const encryptedContent=encrypt(contentBlob,key+'Tjg0MfNGYr');
        const variableNames=getVariableNames(domain);
        const now=(new Date()).getTime();
        localStorage.setItem(variableNames.cachedTime,`${now}`);
        localStorage.setItem(variableNames.cacheFields,encryptedContent);
        return key;    

}
export const loadFormFields = (domain:string, key:string):FormField[]=>{
    const variableNames=getVariableNames(domain);
    const cachedTime:string|null=localStorage.getItem(variableNames.cachedTime);
    if(!cachedTime){
        clearFields();
        return [];
    }
    const now=(new Date()).getTime();
    if((now-parseInt(cachedTime))>cacheTTL){
        clearFields();
        return [];
    }
    const encryptedContent=localStorage.getItem(variableNames.cacheFields);
    if(!encryptedContent){
        clearFields();
        return [];        
    }
    try{
        const contentBlob=decrypt(encryptedContent,key+'Tjg0MfNGYr');
        if(!contentBlob){
            clearFields();
            return [];
        }
        return JSON.parse(contentBlob);        
    }
    catch(error){
        clearFields();
        return [];
    }
};