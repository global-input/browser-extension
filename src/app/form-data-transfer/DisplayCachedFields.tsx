import React, { useEffect, useState } from "react";

import * as chromeExtension from '../chrome-extension';
import * as cache from './cache';
import * as storage from '../storage';
import type { FormField } from '../mobile';


import {NoMobilePage,DarkButton} from '../components';

import {DisplayCacheField} from './forms';
interface Props {
   cacheKey: string | null;
   domain: string;
   back: () => void;
}
export const DisplayCachedFields = ({ cacheKey, domain, back }: Props) => {
   const [fields, setFields] = useState<FormField[]>([]);
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
      const notCopiedFields=fields.filter((f:FormField)=>f!==formField && f.value);
      if(notCopiedFields.length){
          const key = cache.saveCacheFields(domain, notCopiedFields);
          if (key) {
              chromeExtension.sendKey(key);
          }
      }

  }
   if (!fields) {
      return null;
   }
const footer=(
   <DarkButton onClick={back}>Discard</DarkButton>
)

   return (
      <NoMobilePage title="Cached Values" domain={domain} footer={footer}>
         {fields.map((formField:FormField, index:number) => (
                    <DisplayCacheField  key={formField.id}
                        formField={formField}
                        onCopied={()=>{
                               onCopied(formField);
                        }}/>
                ))}
      </NoMobilePage>
   );

};
