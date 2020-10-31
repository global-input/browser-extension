import React, {useEffect } from "react";

import * as chromeExtensionUtil from '../chromeExtensionUtil'
import * as cacheUtil from './cacheUtil';
import {FormField} from 'global-input-react';

import {DisplayInputCopyField,TextButton,FormContainer} from '../app-layout';

interface Props{
   fields:FormField[];
   domain:string;
   back:()=>void;
}
const DisplayCachedFields = ({fields,domain,back}:Props)=>{          
   useEffect(()=>()=>cacheUtil.clearFields(),[]); 
   const onCopied=()=>{
      if(!domain){
         cacheUtil.clearFields();
         return;
      }
      const key=cacheUtil.cacheIfMultipleFields(domain,fields);
      if(key){
              chromeExtensionUtil.sendKey(key);
      }     
   }; 
   if(!fields){
      return null;
   }

   
   return (
               <FormContainer title="Cached Values" domain={domain}>              
                  {fields.map(formField=>(<DisplayInputCopyField 
                  field={formField} 
                  hideValue={true}
                  onCopied={onCopied}
                  key={formField.id}/>))}                                    
                  <TextButton onClick={back} label={'Back'}/>   

               </FormContainer>
   );   
   
};

export default DisplayCachedFields;