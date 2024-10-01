import { MainFunctions } from "./main";
import { MessageHandler } from "./wewrpc";

// Define available functions in the worker
const localFunctions = {
    add: (a: number, b: number) => {
        return a + b;
    },
    addInf: (numbers: number[]) => {
        return numbers.reduce((partialSum, a) => partialSum + a, 0);
    },
    generateRandomList: (n: number): number[] => {
        const randomList: number[] = [];
        for (let i = 0; i < n; i++) {
            randomList.push(Math.floor(Math.random() * 128)); // Random number between 0 and 99
        }
        return randomList;
    }
    
};
// export our type for our worker functions to let main code know of available methods
export type WorkerFunctions = typeof localFunctions;
// use main functions type to inform message handler of avaiable functions we can call
const workerMessageHandler = new MessageHandler<MainFunctions>(self, localFunctions);

const mainSubData = await workerMessageHandler.remote.sub(5, 2);
const mainConcatData = await workerMessageHandler.remote.concat("Hello,", "World!");

console.log("worker got from main: ", mainSubData);
console.log("worker got from main: ", mainConcatData);

