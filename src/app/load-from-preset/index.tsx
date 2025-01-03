import React, { useState , useMemo} from 'react';

import {NoMobilePage,Footer,Label, DarkButton,
    Field, TextArea,Select,Option,MoreInfo, Help} from '../components';

import { useMobile } from 'global-input-mobile';
import * as rules from '../page-control/rules';


interface Props {
    domain: string;
    editRule: (content?: string) => void;
}
const Editor: React.FC<Props> = ({ editRule, domain}) => {
    const [selectedValue, setSelectedValue] = useState('0');
    const [expand,setExpand]=useState("selection");
    const [content, setContent] = useState<string>(() => rules.getPresetRuleByIndexForEdit(0));
    const selectionItems = useMemo(() => {
        return rules.buildSelectionItems()
    }, [])

    const initData = {
        form: {
            title: "Preset Rules",
            fields: [FIELDS.info, FIELDS.back]
        }
    };

    const mobile = useMobile(initData);

    const onUse = () => editRule(content);

    mobile.setOnchange(({field}) => {
        switch (field.id) {
            case FIELDS.back.id:
                editRule();
                break;
        }
    });

    const onSelectionChange = (evt: React.ChangeEvent<HTMLSelectElement>) => {
        setSelectedValue(evt.target.value);
        const rule = rules.getPresetRuleByIndexForEdit(parseInt(evt.target.value));
        setContent(rule);
    }
const footer=(<Footer>
<DarkButton onClick={()=>{
    editRule();
}}>Back</DarkButton>
<DarkButton onClick={onUse}>Use</DarkButton>
</Footer>);

    return (
    <NoMobilePage title="Preset Rules" domain={domain} footer={footer}>

            <Field>
                <Select value={selectedValue} onChange={onSelectionChange}>
                {selectionItems.map(f=>( <Option key={f.value} value={f.value}>{f.label}</Option>))}
              </Select>
              <Help expand={expand} expandId="selection" setExpand={setExpand} position={4}>
              You can select one of the preset rule to starts with for defining the elements in the page that you can control using your mobile
              </Help>
            </Field>
              <Field>
                <TextArea id="ruleContent"
                value={content}
                readOnly={true}
                placeholder="Rules"
                     />
                <Label htmlFor="ruleContent">Rules</Label>
                <Help expand={expand} expandId="rule" setExpand={setExpand} position={5}>
                    If you press "Use" button to load the content in the above text box to the editor to edit to define the elements in the page that you can control using your mobile.
              </Help>
            </Field>

            </NoMobilePage>
        );

}

const FIELDS = {
    info: {
        id: 'info',
        type: "info",
        value: "Please operate in the extension window on your computer"
    },

    back: {
        id: "back-to-edit",
        type: "button",
        label: "Back",
        viewId: "row4"
    }
};


export default Editor;
