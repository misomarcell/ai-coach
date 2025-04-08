/* eslint-disable @typescript-eslint/no-explicit-any */
import { error, info, log } from "firebase-functions/logger";

export class Logger {
	private name: string;

	constructor(name: string) {
		this.name = name;
	}

	info = (...args: any[]) => info(`[${this.name}]: `, ...args);
	error = (...args: any[]) => error(`[${this.name}]: `, ...args);
	log = (...args: any[]) => log(`[${this.name}]: `, ...args);
}
