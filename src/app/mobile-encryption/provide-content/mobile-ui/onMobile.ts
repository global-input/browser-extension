import { useMobile } from 'global-input-mobile';
export const FIELDS = {
    content: {
        id: "contentOnMobile",
        type: 'text',
        nLines: 5,
        value: '',
        viewId: "row2",
    },
    info: {
        id: "info",
        type: "info",
        viewId: "row2",
        value: 'You can now also use your mobile to enter content (via the text box above) on the connected application.'
    },
    cancel: {
        id: 'cancel',
        type: 'button',
        label: 'Cancel',
        viewId: "row3",
        icon:'cancel'
    },

    encrypt: {
        id: "toEncrypt",
        type: "button",
        label: "Encrypt",
        viewId: "row3",
        icon:'encrypt'
    }
}
const initData = (initialContent:string) => ({
    form: {
        title: "Content To Encrypt",
        views: {
            viewIds: {
                row3:{
                    style:{
                        display:'flex',
                        justifyContent:'space-between',
                        width:'100%',
                    }
                }
                                }
        },
        fields: [{ ...FIELDS.content, value: initialContent }, FIELDS.info, FIELDS.cancel, FIELDS.encrypt]
    }
});
interface UseConnectMobileProps{
    initialContent:string;
    cancel:()=>void;
    setContent:(content:string)=>void;
    onEncrypt:()=>void;
}
export const useConnectMobile = ({initialContent,cancel,setContent,onEncrypt}:UseConnectMobileProps) =>{
    const mobile = useMobile(()=>initData(initialContent), true);
    mobile.setOnchange(({ field }) => {
        switch (field.id) {
            case FIELDS.content.id:
                setContent(field.value as string);
                break;
            case FIELDS.cancel.id:
                cancel();
                break;
            case FIELDS.encrypt.id:
                onEncrypt();
                break;
            default:
        }
    });
    return mobile;
}
