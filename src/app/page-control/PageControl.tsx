import React from 'react';


import * as rules from './rules';
import { useControl } from './controllers';


interface Props {
    back: () => void;
    domain: string;
    form: rules.FormRule;
    editRule: () => void;
    loadRule: () => void;
}


const PageControl: React.FC<Props> = ({ back, domain, form, editRule, loadRule }) => {
    const { mobile, display } = useControl({ back, domain, form, editRule, loadRule })
    return (
        <mobile.ControlledContainer title="Page Control" domain={domain}>
            {display}
        </mobile.ControlledContainer>
    )
}


export default PageControl;