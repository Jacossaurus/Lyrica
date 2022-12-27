import {
	ButtonInteraction,
	CommandInteraction,
	StringSelectMenuInteraction,
} from "discord.js";

export async function deleteReply(
	interaction:
		| CommandInteraction
		| StringSelectMenuInteraction
		| ButtonInteraction,
	time?: number
) {
	setTimeout(() => interaction.deleteReply(), time || 10000);
}
