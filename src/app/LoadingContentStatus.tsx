import React, { useEffect } from "react";
import {NoMobilePage,Spinner} from './components';

import * as chromeExtension from './chrome-extension';

interface Message {
    status?: string;
    host?: string;
    content: {
        key?: string;
    }
}
interface Props {
    onReceivedPageStatus: (message: Message) => void
}
export const LoadingContentStatus = ({ onReceivedPageStatus }: Props) => {
    useEffect(() => {
        const checkPageStatus = async () => {
            const message = await chromeExtension.checkPageStatus();
             onReceivedPageStatus(message);
        };
        checkPageStatus();
    }, [onReceivedPageStatus]);

    return (
        <NoMobilePage title="Loading..." domain="">
                <Spinner />
        </NoMobilePage>
    );

};
