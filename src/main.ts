import { ActivityType, Client, Events } from "discord.js";
import { config } from "dotenv";
import { deleteReply } from "./utils/deleteReply";
import { getCommands } from "./utils/getCommands";
import { getInteractions } from "./utils/getInteractions";
import MusicService from "./services/musicService";

config();

const client = new Client({
	intents: [],
});

async function init() {
	const commands = await getCommands();
	const interactions = await getInteractions();

	client.on(Events.InteractionCreate, async (interaction) => {
		if (interaction.isChatInputCommand()) {
			const command = commands.get(interaction.commandName);

			if (command) {
				await command.execute(interaction);
			} else {
				await interaction.reply(`Failed to find command.`);

				deleteReply(interaction);
			}
		} else if (interaction.isAutocomplete()) {
			const command = commands.get(interaction.commandName);

			if (command && command.autocomplete !== undefined) {
				try {
					await command.autocomplete(interaction);
				} catch (error) {
					console.error(
						`Failed to run autocomplete for command ${interaction.commandName}. ${error}`
					);
				}
			} else {
				console.error(
					`Failed to find command or command did not have autocomplete. Command: ${interaction.commandName}`
				);
			}
		} else if (interaction.isStringSelectMenu() || interaction.isButton()) {
			const interactionCallback = interactions.get(interaction.customId);

			if (interactionCallback !== undefined) {
				await interactionCallback(interaction);
			} else {
				await interaction.reply(
					`Failed to find interaction from Custom ID (${interaction.customId})`
				);

				deleteReply(interaction);
			}
		}
	});

	client.once("ready", () => {
		console.log(`${client.user.tag} is online!`);

		client.user.setActivity("you.", {
			type: ActivityType.Listening,
		});
	});

	client.login(process.env.DISCORD_TOKEN);
}

init();

process.on("uncaughtException", (err) => console.error(err));
