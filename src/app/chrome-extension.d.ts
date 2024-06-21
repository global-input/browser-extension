type Message = { status: string; content: any; };

type Callback = (message: Message) => void;

interface ChromeAPIArgs {
    callback: Callback;
    messageType: string;
    content: any;
}

export function callChromeAPI(args: ChromeAPIArgs): void;
export function sendMessageToContent(messageType: string, content: any): Promise<Message>;

export function checkPageStatus(): Promise<Message>;
export function requestPageConfig(request: any): Promise<Message>;
export function getPageControlConfig(applicationControlConfig: any): Promise<Message>;
export function sendFormField(fieldId: string, fieldValue: any): Promise<Message>;
export function resetStatus(): Promise<Message>;
export function sendKey(key: string): Promise<Message>;

/*
// Uncomment and define if needed
// export function addChromeListener(callback: Callback): void;
// export function registerContentListener(): void;
*/