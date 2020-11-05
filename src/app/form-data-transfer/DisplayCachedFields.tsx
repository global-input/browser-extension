import React, { useEffect, useState } from "react";

import * as chromeExtension from '../chrome-extension';
import * as cache from './cache';
import * as storage from '../storage';
import {FormField} from '../mobile'; //types;

import { DisplayInputCopyField, TextButton, BasicLayout,FormContainer } from '../app-layout';

interface Props {
   cacheKey: string | null;
   domain: string;
   back: () => void;
}
const DisplayCachedFields = ({ cacheKey, domain, back }: Props) => {
   const [fields, setFields] = useState<FormField[]>([]);
   useEffect(() => () => storage.clearCacheFields(), []);
   useEffect(() => {
      if (cacheKey && domain) {
         const cachedFields = cache.loadCacheFields(domain, cacheKey);
         if (!cachedFields || !cachedFields.length) {
            back();
            return;
         }
         setFields(cachedFields);
      }
   }, [cacheKey, back, domain]);
   const onCopied = () => {
      if (!domain) {
         storage.clearCacheFields();
         return;
      }
      const key = cache.saveCacheFields(domain, fields);
      if (key) {
         chromeExtension.sendKey(key);
      }
   };
   if (!fields) {
      return null;
   }


   return (
      <BasicLayout title="Global Input App" domain={domain}>
      <FormContainer title="Cached Values">
         {fields.map(formField => (<DisplayInputCopyField
            field={formField}
            hideValue={true}
            onCopied={onCopied}
            key={formField.id} />))}
         <TextButton onClick={back} label={'Back'} />

      </FormContainer>
      </BasicLayout>
   );

};

export default DisplayCachedFields;