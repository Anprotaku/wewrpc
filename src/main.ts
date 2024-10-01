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
const d = await mainMessageHandler.remote.generateRandomList(100);
const d2 = await mainMessageHandler.remote.addInf(...d);

console.log("main got from worker: ", d);
console.log("main got from worker: ", d2);

(async function performanceTest() {
    let iteration = 0;
    console.time("Total time for infinite loop");

    while (true) {
        // console.time("Iteration time");

        // // Measure the time to generate the random list and process it with addInf
        // console.time("generateRandomList");
        const d = await mainMessageHandler.remote.generateRandomList(100);
        const d2 = await mainMessageHandler.remote.addInf(...d);
        // console.timeEnd("addInf");

        // console.log(`Iteration ${iteration} - got from worker: `, d);
        //console.log(`WORKER: Iteration ${iteration} - got from worker: `, d2);

        // console.timeEnd("Iteration time");

        iteration++;
        if (iteration >= 65535) { // Just a condition to break the loop after 1000 iterations
            break;
        }
    }

    console.timeEnd("Total time for infinite loop");
})();

const addInf = (...numbers: number[]): number => {
    return numbers.reduce((partialSum, a) => partialSum + a, 0);
};

const generateRandomList = (n: number): number[] => {
    const randomList: number[] = [];
    for (let i = 0; i < n; i++) {
        randomList.push(Math.floor(Math.random() * 128)); // Random number between 0 and 127
    }
    return randomList;
};

const results: { list: number[], sum: number }[] = [];

(function performanceTest() {
    let iteration = 0;
    console.time("Total time for infinite loop2");

    while (true) {
        // console.time("Iteration time");

        // // Measure the time to generate the random list and process it with addInf
        // console.time("generateRandomList");
        const d = generateRandomList(100);
        // console.timeEnd("generateRandomList");

        // console.time("addInf");
        const d2 = addInf(...d);
        // console.timeEnd("addInf");
        results.push({ list: d, sum: d2 });

        // console.log(`Iteration ${iteration} - got from local generateRandomList: `, d);

        // console.timeEnd("Iteration time");

        iteration++;
        if (iteration >= 65535) { // Optional: Limit to 1000 iterations to avoid infinite loop issues
            break;
        }
    }

    console.timeEnd("Total time for infinite loop2");
})();