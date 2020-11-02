import React, { useEffect, useState } from "react";

import {chromeExtension} from '../utils';

import {clearCacheFields,loadCacheFields,saveCacheFields}  from '../utils';
import {FormField} from '../utils'; //types;

import { DisplayInputCopyField, TextButton, BasicLayout,FormContainer } from '../app-layout';

interface Props {
   cacheKey: string | null;
   domain: string;
   back: () => void;
}
const DisplayCachedFields = ({ cacheKey, domain, back }: Props) => {
   const [fields, setFields] = useState<FormField[]>([]);
   useEffect(() => () => clearCacheFields(), []);
   useEffect(() => {
      if (cacheKey && domain) {
         const cachedFields = loadCacheFields(domain, cacheKey);
         if (!cachedFields || !cachedFields.length) {
            back();
            return;
         }
         setFields(cachedFields);
      }
   }, [cacheKey, back, domain]);
   const onCopied = () => {
      if (!domain) {
         clearCacheFields();
         return;
      }
      const key = saveCacheFields(domain, fields);
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