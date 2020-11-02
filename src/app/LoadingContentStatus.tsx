import React, { useEffect } from "react";
import { BasicLayout, LoadingCircle} from './app-layout';

import {chromeExtension} from './utils';

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
            const message = await chromeExtension.checkPageStatus();
            onReceivedPageStatus(message);
        };
        checkPageStatus();
    }, [onReceivedPageStatus]);

    return (
        <BasicLayout title="Global Input App">
            <LoadingCircle />
        </BasicLayout>
    );

};
export default LoadingContentStatus;
