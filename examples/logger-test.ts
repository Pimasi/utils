import { Logger } from "../src/logger";

const logger = Logger({});

logger.info("Hello world");

logger.error(new Error());
