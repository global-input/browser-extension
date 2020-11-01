import React, { useEffect } from "react";
import { MessageContainer, LoadingCircle } from './app-layout';
import * as chromeExtensionUtil from './chromeExtensionUtil';

interface Message {
    status: string;
    host: string;
    content: {
        key?: string;
    }
}
interface Props {
    onReceivedPageStatus: (message: Message) => void
}
const LoadingContentStatus = ({ onReceivedPageStatus }: Props) => {
    useEffect(() => {
        const checkPageStatus = async () => {
            const message = await chromeExtensionUtil.checkPageStatus();
            onReceivedPageStatus(message);
        };
        checkPageStatus();
    }, [onReceivedPageStatus]);

    return (<MessageContainer
        title="Global Input App">
        <LoadingCircle />
    </MessageContainer>);

};
export default LoadingContentStatus;
