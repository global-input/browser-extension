import React from 'react';
import { ControlLayout } from '../app-layout';

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
        <ControlLayout title="Page Control" mobile={mobile}>
            {display}
        </ControlLayout>
    )
}


export default PageControl;