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
        value: ""
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


const initData = (domain:string,fields:FormField[],formRule:FormRule) => {

    return {
        form: {
            title: formRule.title,
            domain: domain,
            id: formRule.id,
            views: {
                viewIds: {
                    row1:{
                        style:{
                            display:'flex',
                            justifyContent:'space-between',
                            padding:20,
                            width:'100%',
                        }
                    }
                }
            },
            fields: [{...FIELDS.domain,value:domain}, ...fields, FIELDS.message, FIELDS.back, FIELDS.editRule]
        }
    }
};
export const useConnectToPageControl = (domain:string,fields:FormField[],formRule:FormRule,back:()=>void, editRule:()=>void) =>{
    const mobile=useMobile(()=>initData(domain,fields,formRule), true);
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
