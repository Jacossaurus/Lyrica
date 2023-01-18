import {
    AutocompleteInteraction,
    ChatInputCommandInteraction,
    Interaction,
    Message,
    SlashCommandBuilder,
} from "discord.js";

export interface Command {
    data: SlashCommandBuilder;

    executeSlash: (interaction: ChatInputCommandInteraction) => Promise<any>;
    executeInformal?: (message: Message) => Promise<any>;
    autocomplete: (interaction: AutocompleteInteraction) => Promise<any>;
    interactions?: {
        [key: string]: (interaction: Interaction) => Promise<any>;
    };
}
