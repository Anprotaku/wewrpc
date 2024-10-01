import "./style.css";
import { MessageHandler } from './wewrpc';
import { WorkerFunctions } from './worker';
import Worker from './worker.ts?worker';
const worker = new Worker();

// define available functions in the main 
// this would be system calls we let the worker call
const localFunctions = {
    sub: async (a: number, b: number) => {
        return a - b;
    },

    concat: (a: string, b: string) => {
        return `${a} ${b}`;
    }
};
// export our type for our main functions to let worker know of available methods
export type MainFunctions = typeof localFunctions;

const mainMessageHandler = new MessageHandler<WorkerFunctions>(worker, localFunctions);



// Call the `add` function in the worker
const d = await mainMessageHandler.remote.generateRandomList(10_000_000);
const d2 = await mainMessageHandler.remote.addInf(d);

console.log("main got from worker: ", d);
console.log("main got from worker: ", d2);
