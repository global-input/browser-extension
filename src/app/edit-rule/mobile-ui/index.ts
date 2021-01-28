import { useMobile } from '../../mobile';

const FIELDS = {
    domain: {
        type: 'info',
        value: '',
    },
    info: {
        id: 'info',
        type: "info",
        value: "Please operate in the extension window on your computer",
        viewId: "row3"
    },
    editor: {
        id: 'editor',
        type: 'text',
        nLines: 5,
        value: '',
        viewId: "row3"
    },
    cancel: {
        id: "cancelEdit",
        type: "button",
        label: "Cancel",
        viewId: "row4"
    },
    save: {
        id: "saveEdit",
        type: "button",
        label: "Save",
        viewId: "row4"
    },
    loadFromPreset: {
        id: "load-from-preset",
        type: "button",
        label: "Use Preset",
        viewId: "row5"
    }
};

    const initData = (domain:string, content:string) => ({
        form: {
            title: "Edit Rules",
            views: {
                viewIds: {
                    row4:{
                        style:{
                            display:'flex',
                            justifyContent:'space-between',
                            padding:20,
                            width:'100%',
                        }
                    }
                }
            },
            fields: [{ ...FIELDS.domain, value: domain }, FIELDS.info, { ...FIELDS.editor, value: content },
                FIELDS.cancel, FIELDS.save, FIELDS.loadFromPreset]
        }
    });

export const useConnectToMobile=(domain:string, content:string, back:()=>void, setContent:(content:string)=>void,onSave:()=>void, loadFromPreset:()=>void)=>{
    const mobile = useMobile(()=>initData(domain, content));
    mobile.setOnchange(({field}) => {
        switch (field.id) {
            case FIELDS.cancel.id:
                back();
                break;
            case FIELDS.editor.id:
                setContent(field.value as string);
                break;
            case FIELDS.save.id:
                onSave();
                break;
            case FIELDS.loadFromPreset.id:
                loadFromPreset();
                break;
            default:
        }
    });
    const { sendValue } = mobile;

    const sendContent = (content:string)=>{
        sendValue(FIELDS.editor.id, content);
    };
    return {mobile,sendContent};
}
