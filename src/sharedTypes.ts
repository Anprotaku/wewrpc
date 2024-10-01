export type FunctionMap = {
    [key: string]: (...args: any[]) => Promise<any> | any; // Supports async and sync functions
};

export interface EventListener<T extends any[]> {
    functionName: string;
    data: T;
    messageId: string;  // ID for tracking
}

export interface EventResponse<T = any> {
    returnData?: T;
    error?: string;
    messageId: string;  // ID for tracking response
}

export class WorkerManager<T extends FunctionMap> {
    private worker: Worker;
    private callbacks: Map<string, (data: any) => void> = new Map();

    constructor(worker: Worker) {
        this.worker = worker;

        // Handle messages from the worker
        this.worker.onmessage = this.handleWorkerMessage.bind(this);


        this.worker.onerror = (error) => {
            console.error('Worker error:', error.message);
        };
    }

    private handleWorkerMessage(event: MessageEvent<EventResponse>): void {
        const { messageId, returnData, error } = event.data;
        const callback = this.callbacks.get(messageId);
        if (callback) {
            if (error) {
                callback(Promise.reject(new Error(error)));
            } else {
                callback(Promise.resolve(returnData));
            }
            this.callbacks.delete(messageId); // Remove after handling
        }
    }


    // A method to call worker functions asynchronously
    callFunction<K extends keyof T>(
        functionName: K,
        ...data: Parameters<T[K]>
    ): Promise<ReturnType<T[K]>> {
        return new Promise((resolve, reject) => {
            const messageId = this.generateMessageId();
            this.callbacks.set(messageId, resolve);

            const message: EventListener<Parameters<T[K]>> = {
                functionName: functionName as string,
                data,
                messageId,
            };

            this.worker.postMessage(message);
        });
    }

    // Generate a unique message ID
    private generateMessageId(): string {
        return Math.random().toString(36).substring(2, 15);
    }
}
