import React, { useEffect, useState } from "react";

import * as chromeExtension from '../chrome-extension';
import * as cache from './cache';
import * as storage from '../storage';
import type { FormField } from '../mobile';


import {NoMobilePage,DarkButton,Important} from '../components';

import {DisplayCacheField} from './forms';
interface Props {
   cacheKey: string | null | undefined;
   domain: string;
   back: () => void;
}
export const DisplayCachedFields = ({ cacheKey, domain, back }: Props) => {
   const [fields, setFields] = useState<FormField[]>([]);
   const [message,setMessage]=useState('');
   useEffect(() => {
      if (cacheKey && domain) {
         const cachedFields = cache.loadCacheFields(domain, cacheKey);

         storage.clearCacheFields();
         if (!cachedFields || !cachedFields.length) {
            back();
            return;
         }
         setFields(cachedFields);
      }
   }, [cacheKey, back, domain]);

   const onCopied=(formField:FormField)=>{
      const {key,message}=cache.saveRemainingFieldsToCache(domain,formField,fields);
        if(key){
                chromeExtension.sendKey(key);
                message && setMessage(message);
        }

  }
const footer=(
   <DarkButton onClick={back}>Back</DarkButton>
)

   return (
      <NoMobilePage title="Cached Values" domain={domain} footer={footer}>
         {message && (<Important>{message}</Important>)}
         {fields && fields.map((formField:FormField, index:number) => (
                    <DisplayCacheField  key={formField.id}
                        formField={formField}
                        onCopied={()=>{
                               onCopied(formField);
                        }}/>
                ))}
      </NoMobilePage>
   );

};
