

import { useMobile} from 'global-input-mobile';
import type {FormField,MobileData} from 'global-input-mobile';
import type {InitData} from 'global-input-mobile';
import * as storage from '../../storage';
export * from 'global-input-mobile';
const userWithDomainAsFormId = (initData: InitData) => {
    if (initData?.form?.domain && initData?.form?.fields?.length) {
        const textFields = initData.form.fields.filter(f => {
            if ((!f.type) || f.type === 'text') {
                if (f.nLines && f.nLines > 1) {
                    return false;
                }
                return true;
            }
            return false;
        });
        if (!textFields.length) {
            return null;
        }
        initData.form.id = `###${textFields[0].id}###@${initData.form.domain}`;
    }
};

export const FIELDS = {
    back:{
        id:'back-to-main',
        type:'button',
        viewId: "row1",
        label:'Back'


    },
    visibility: {
        id: "fieldValueVisibility",
        type: 'button',
        viewId: "row1",
        options: [{ value: 0, label: 'Show' }, { value: 1, label: 'Hide' }],
        value: 0
    }


};

interface VisibilityOption{
    value:number;
    label:string;

}

interface ConnectMobileProps{
    domain:string;
    formFields:FormField[];
    configId:any;
    visibility:VisibilityOption;
    setVisibility:(visibility:VisibilityOption)=>void;
    onFormModified:(formFields:FormField[],isStructureChanged:boolean)=>void;
    back:()=>void;

}
export const useConnectMobile = ({domain,formFields,configId,visibility, setVisibility,onFormModified,back}:ConnectMobileProps)=>{


     const initData = () => {
        const initData = {
            id: 'transfer-form',
            form: {
                title: domain,
                domain: domain,
                label: domain,
                fields: [...formFields,...Object.values(FIELDS)]
            }
        }
        userWithDomainAsFormId(initData);
        return initData;
    };
    const mobile = useMobile(initData, false,configId);
    mobile.setOnchange(({ field }) => {
        switch (field.id) {
            case FIELDS.visibility.id:
                const vis = getNextVisibilityValue(visibility);
                setVisibility(vis);
                sendVisibility(mobile,vis);
                break;
            case FIELDS.back.id:
                back();
                break;
            default:
                let fieldModified = false;
                const newFormFields=formFields.map(f=>{
                    if (f.id === field.id) {
                        fieldModified = true;
                        return {...f,value:field.value};
                    }
                    else{
                        return f;
                    }
                });
                if(fieldModified){
                    onFormModified(newFormFields,false);
                }
        }
    });
    return mobile;

};



export const getNextVisibilityValue = (visibility:VisibilityOption) => {
    return visibility === FIELDS.visibility.options[0] ? FIELDS.visibility.options[1] : FIELDS.visibility.options[0];
};

export const sendVisibility=(mobile:MobileData, visibility:VisibilityOption)=>{
    mobile.sendValue(FIELDS.visibility.id, visibility.value);
}


const defaultFormFields = [{
    id: "username",
    label: "Username",
    value: ''
}, {
    id: "password",
    label: "Password",
    type: "secret",
    value: ''
}, {
    id: "note",
    label: "Note",
    nLines: 5, value: '',
}];

export const buildFormFields = (domain: string) => {
    let fields = storage.loadSavedFormFields(domain);
    if (!fields) {
        fields = defaultFormFields;
    }
    return fields;
};
