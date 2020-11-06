import React, { useState, useEffect,useCallback } from 'react';
import { TextButton, Title,SelectItems,MessageContainer, InputWithLabel, FormFooter,FormContainer, ControlLayout } from '../../app-layout';
import { useMobile } from '../../mobile';
import * as rules from '../rules';


interface Props {
    back: () => void;
    domain: string;
    loadRule:(content:string)=>void;
}
const Editor: React.FC<Props> = ({ back, domain,loadRule}) => {
    const [content,setContent] = useState<string>('');
    const [selectedValue,setSelectedValue]=useState('0');
    const [selectionItems, setSelectionItems]=useState<rules.RuleSelectionItem[]>(()=>{
        return rules.buildSelectionItems();
    });
    const mobile = useMobile({
        action: "input",
        dataType: "form",
        form: {
            title: "Examples",
            fields: Object.values(FIELDS)
        }
    });
    const onUse= ()=>loadRule(content);

    mobile.setOnchange(({field})=>{
        switch(field.id){
            case FIELDS.back.id:
                back();
                break;
            case FIELDS.editor.id:
                setContent(field.value as string);
                break;
            case FIELDS.use.id:
                onUse();
                break;
        }
    });
    const onContentChange=useCallback((content:string)=>{
        setContent(content);
        mobile.sendValue(FIELDS.editor.id,content);
    },[]);

    const onSelectionChange=(evt:React.ChangeEvent<HTMLSelectElement>)=>{
       // setSelectionItems(evt.target.value);

    }


    return (

        <ControlLayout title="Edit Rule" mobile={mobile}>
            <FormContainer>

            <Title>{domain}</Title>


            <InputWithLabel label="Rule" id="content"
                onChange={onContentChange}
                type="textarea"
                value={content}/>


            <SelectItems id="rulSelection" items={selectionItems} value={selectedValue} label="Load Example:" onChange={onSelectionChange}/>
            <FormFooter>
                <TextButton onClick={back} label='Cancel' />
                <TextButton onClick={onUse} label='Use' />
            </FormFooter>

            </FormContainer>


        </ControlLayout>);

}

const FIELDS = {
    info:{
        id:'info',
        type:"info",
        value:"Select example that you can use for setting the rule"
    },
    editor: {
        id: 'editor',
        type: 'text',
        nLines: 5,
        value: '',
        viewId: "row3"
    },
    back: {
        id: "back-to-edit",
        type: "button",
        label: "Back",
        viewId: "row4"
    },
    use: {
        id: "use",
        type: "button",
        label: "Use",
        viewId: "row4"
    }
};


export default Editor;
