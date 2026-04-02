import { Logger } from "../src";

let logger = Logger.Logger({});

let start = new Date();
let entries = 100_000;
for (let i = 0; i < entries; i++) {
    logger.info(`Log entry number ${i}`);
}

let time = new Date().getTime() - start.getTime();
console.log(
    "==========================",
    `Logging ${entries} entries took ${time}ms - ${Math.round((entries / time) * 1000)} entries/s`,
);
