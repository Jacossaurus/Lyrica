import { Interaction } from "discord.js";
import { getCommands } from "./getCommands";

export async function getInteractions() {
	const interactions: Map<
		string,
		(interaction: Interaction) => Promise<any>
	> = new Map();

	const commands = await getCommands();

	for (const [i, command] of commands) {
		if (command.interactions === undefined) continue;

		for (const [customId, callback] of Object.entries(
			command.interactions
		)) {
			if (interactions.get(customId) === undefined) {
				interactions.set(customId, callback);
			} else {
				console.error(
					`DANGEROUS: Custom ID duplicates found for ${customId}`
				);
			}
		}
	}

	return interactions;
}
