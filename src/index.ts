import "./logging.ts";
import { bot } from "./bot.ts";
import { pool } from "./db/index.ts";

let shuttingDown = false;

async function shutdown(reason: string, exitCode: number): Promise<void> {
	if (shuttingDown) {
		return;
	}
	shuttingDown = true;
	console.log(`${reason}. Shutting down...`);

	const forceExit = setTimeout(() => process.exit(exitCode || 1), 10_000);
	forceExit.unref();

	try {
		await bot.stop();
		await pool.end();
	} catch (error) {
		console.error("Error during shutdown:", error);
		exitCode ||= 1;
	}
	process.exit(exitCode);
}

for (const signal of ["SIGINT", "SIGTERM"] as const) {
	process.on(signal, () => void shutdown(`Received ${signal}`, 0));
}

process.on("unhandledRejection", (reason) => {
	console.error("Unhandled promise rejection:", reason);
});

process.on("uncaughtException", (error) => {
	console.error("Uncaught exception:", error);
	void shutdown("Uncaught exception", 1);
});

await bot.start();
