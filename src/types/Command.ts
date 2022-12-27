import {
	AutocompleteInteraction,
	ChatInputCommandInteraction,
	Interaction,
	SlashCommandBuilder,
} from "discord.js";

export interface Command {
	data: SlashCommandBuilder;

	execute: (interaction: ChatInputCommandInteraction) => Promise<any>;
	autocomplete: (interaction: AutocompleteInteraction) => Promise<any>;
	interactions?: {
		[key: string]: (interaction: Interaction) => Promise<any>;
	};
}
