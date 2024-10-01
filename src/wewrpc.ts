import { nanoid } from 'nanoid';


export type FunctionMap = {
    [key: string]: (...args: any[]) => Promise<any> | any; // Supports async and sync functions
};
export interface FunctionCallPayLoad<T extends any[]> {
    functionName: string;
    data: T;
    messageId: string;  // ID for tracking
}
export interface FunctionResponsePayLoad<T = any> {
    returnData?: T;
    error?: string;
    messageId: string;  // ID for tracking response
}
export enum MESSAGE_TYPE {
    FUNCTION_CALL,
    FUNCTION_RESULT
}
// Define a message structure for FUNCTION_CALL
export interface FunctionCallMessage {
    type: MESSAGE_TYPE.FUNCTION_CALL;
    payLoad: FunctionCallPayLoad<any[]>;
}
// Define a message structure for FUNCTION_RESULT
export interface FunctionResultMessage {
    type: MESSAGE_TYPE.FUNCTION_RESULT;
    payLoad: FunctionResponsePayLoad<any>;
}
// Union type for all possible messages
export type WorkerMessage = FunctionCallMessage | FunctionResultMessage;

// Define an interface with generics for postMessage and onmessage
interface MessageInterface<T> {
    postMessage: (message: T) => void;
    onmessage: ((event: MessageEvent<T>) => void) | null;
}

export class MessageHandler<OtherFunctions extends FunctionMap> {
    private callbacks: Map<string, (data: any) => void> = new Map();
    private messageObject: MessageInterface<WorkerMessage>;
    private functions: FunctionMap;

    constructor(messageObject: MessageInterface<WorkerMessage>, functions: FunctionMap) {
        this.messageObject = messageObject;
        this.functions = functions;

        this.messageObject.onmessage = async (message: MessageEvent<WorkerMessage>) => {
            const { type, payLoad } = message.data;
        
            if (type === MESSAGE_TYPE.FUNCTION_CALL) {
                const { functionName, data, messageId } = payLoad;
                const result = await this.functions[functionName](...data);
                this.sendMessage({ 
                    type: MESSAGE_TYPE.FUNCTION_RESULT, 
                    payLoad: { returnData: result, messageId }
                });
            } else if (type === MESSAGE_TYPE.FUNCTION_RESULT) {
                const { returnData, error, messageId } = payLoad;
                const callback = this.callbacks.get(messageId);
        
                if (callback) {
                    callback(error ? Promise.reject(new Error(error)) : Promise.resolve(returnData));
                    this.callbacks.delete(messageId);
                }
            }
        };
        
        // this.messageObject.onmessage = async (message: MessageEvent<WorkerMessage>) => {
        //     switch (message.data.type) {
        //         case MESSAGE_TYPE.FUNCTION_CALL: {
        //             const { functionName, data, messageId } = message.data.payLoad;

        //             const result = await this.functions[functionName](...data);
        //             this.sendMessage({
        //                 type: MESSAGE_TYPE.FUNCTION_RESULT,
        //                 payLoad: { returnData: result, messageId },
        //             });

        //             //console.log(`Function call: ${functionName}, data:`, data, `messageId: ${messageId}`);
        //             break;
        //         }
        //         case MESSAGE_TYPE.FUNCTION_RESULT: {
        //             const { returnData, error, messageId } = message.data.payLoad;
        //             if (error) {
        //                 console.error(`Error from messageId ${messageId}:`, error);
        //             } else {
        //              //   console.log(`Result from messageId ${messageId}:`, returnData);
        //             }
        //             const callback = this.callbacks.get(messageId);
        //             if (callback) {
        //                 if (error) {
        //                     callback(Promise.reject(new Error(error)));
        //                 } else {
        //                     callback(Promise.resolve(returnData));
        //                 }
        //                 this.callbacks.delete(messageId); // Remove after handling
        //             }
        //             break;
        //         }
        //         default: {
        //             console.error('Unknown message type:', message);
        //             break;
        //         }
        //     }
        // };
    }
    
    public get remote(): { [K in keyof OtherFunctions]: (...args: Parameters<OtherFunctions[K]>) => Promise<Awaited<ReturnType<OtherFunctions[K]>>> } {
        return new Proxy({}, {
            get: (_, functionName: string) => {
                return (...args: any[]) => {
                    // TODO: FIX THIS!!!!!!!!
                    // DONT WANT TO USE ANY HERE :(
                    return this.callFunction(functionName, ...args as any);
                };
            },
        }) as { [K in keyof OtherFunctions]: (...args: Parameters<OtherFunctions[K]>) => Promise<Awaited<ReturnType<OtherFunctions[K]>>> };
    }

    public callFunction<K extends keyof OtherFunctions>(
        functionName: K,
        ...args: Parameters<OtherFunctions[K]>
    ): ReturnType<OtherFunctions[K]> {
        return new Promise((resolve, reject) => {
            const messageId = nanoid();
            this.callbacks.set(messageId, resolve);

            this.sendMessage({
                type: MESSAGE_TYPE.FUNCTION_CALL,
                payLoad: {
                    functionName: functionName as string,
                    data: args,
                    messageId,
                },
            });
        }) as ReturnType<OtherFunctions[K]>; // Resolving the correct return type
    }
    

    // Method to send a message using the object's postMessage function
    public sendMessage(message: WorkerMessage) {
        this.messageObject.postMessage(message);
    }


    // Clean up by setting the onmessage handler to null
    public destroy() {
        this.messageObject.onmessage = null;
    }
}
