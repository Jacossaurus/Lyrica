import { readdirSync } from "fs";
import { join } from "path";
import { Command } from "../types/Command";

export async function getCommands() {
	const commands: Map<string, Command> = new Map();

	const commandsPath = join(__dirname, "..", "commands");
	const commandFiles = readdirSync(commandsPath).filter((file) =>
		file.endsWith(".js")
	);

	for (const filePath of commandFiles) {
		const file: {
			default?: Command;
		} = await import(join(commandsPath, filePath));

		if (file.default?.data !== undefined) {
			commands.set(file.default.data.name, file.default);
		}
	}

	return commands;
}
