import React, { useEffect } from 'react';
import { ControlLayout } from '../app-layout';


import * as rules from './rules';
import { useLoader } from './controllers';


interface Props {
    back: () => void;
    domain: string;
    editRule: () => void;
    processRule: (rule: rules.PageRule) => void;
}

const LoadRules: React.FC<Props> = ({ back, domain, editRule, processRule }) => {

    const { onError, mobile, display } = useLoader({ domain, back, editRule });
    useEffect(() => {
        if (!domain) {
            onError("The domain of the loaded page cannot be identified.");
            return;
        }
        let rule = rules.findRuleByDomain(domain);
        if (!rule) {
            onError("No matching rules found for the loaded page.");
            return;
        }
        processRule(rule);
    }, [domain, onError, processRule]);
    return (
        <ControlLayout title="Page Control" mobile={mobile}>
            {display}
        </ControlLayout>

    );
}
export default LoadRules;