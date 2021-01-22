import { useMobile } from '../../mobile';
import type {FormField} from '../../mobile';
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


const initData = (domain:string, title:string) => {
    return {
        form: {
            title: title,
            domain: domain,
            fields: [FIELDS.message, FIELDS.back, FIELDS.editRule]
        }
    }
};
export const useConnectErrorControl = (domain:string,back:()=>void, editRule:()=>void, title:string) =>{
    const mobile=useMobile(()=>initData(domain,title), true);
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
