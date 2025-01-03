import { useMobile } from 'global-input-mobile';
import type {FormField} from 'global-input-mobile';
import type {FormRule} from '../rules';


const FIELDS = {
    domain: {
        id: "domain",
        type: "info",
        value: "..."
    },
    message: {
        id: "message",
        type: "info",
        value: "Error"
    },
    back: {
        id: 'back',
        type: "button",
        label: "Back",
        viewId: "row1"
    },
    editRule: {
        id: 'editRule',
        type: "button",
        label: "Edit Rule",
        viewId: "row1"
    }
};


const initData = (domain:string, errorTitle:string, errorMessage:string) => {
    return {
        form: {
            title: errorTitle,
            domain: domain,
            fields: [{...FIELDS.domain, domain},{...FIELDS.message, value:errorMessage}, FIELDS.back, FIELDS.editRule]
        }
    }
};
export const useConnectErrorControl = (domain:string,back:()=>void, editRule:()=>void, errorTitle:string, errorMessage:string) =>{
    const mobile=useMobile(()=>initData(domain,errorTitle,errorMessage), true);
    mobile.setOnchange(({field}) => {
        switch (field.id) {
            case FIELDS.back.id:
                back();
                break;
            case FIELDS.editRule.id:
                editRule();
                break;
            default:
        }
    });
    return mobile;
}
