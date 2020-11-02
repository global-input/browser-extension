import React, { useEffect } from "react";
import { BasicLayout, LoadingCircle,Title} from './app-layout';
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

    return (
        <BasicLayout title="Global Input App">
            <LoadingCircle />
        </BasicLayout>
    );

};
export default LoadingContentStatus;
