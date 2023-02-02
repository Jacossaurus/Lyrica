import { REST, Routes } from "discord.js";
import { config } from "dotenv";
import { Command } from "../types/Command";
import { getCommands } from "./getCommands";

config();

const rest = new REST().setToken(process.env.DISCORD_TOKEN);

async function registerCommands() {
    const commands = await getCommands();

    const global: Command[] = [];
    const guilds: Map<string, Array<Command>> = new Map();

    commands.forEach((command) => {
        if (command.targetGuildIds === undefined) {
            global.push(command);
        } else {
            command.targetGuildIds.forEach((guildId) => {
                const guild = guilds.get(guildId) || [];

                guild.push(command);

                guilds.set(guildId, guild);
            });
        }
    });

    try {
        if (global.length > 0) {
            console.log(
                `Attempting to register ${global.length} commands globally.`
            );

            const response = await rest.put(
                Routes.applicationCommands(process.env.APP_ID),
                {
                    body: global.map((command) => command.data.toJSON()),
                }
            );

            console.log(
                `Successfully registered ${
                    (response as Array<any>).length
                } commands globally.`
            );
        } else {
            console.log("No commands found to be registered globally.");
        }

        if (guilds.size > 0) {
            for (const [guildId, guildCommands] of guilds) {
                console.log(
                    `Attempting to register ${guildCommands.length} commands for guild (${guildId}).`
                );

                const response = await rest.put(
                    Routes.applicationGuildCommands(
                        process.env.APP_ID,
                        guildId
                    ),
                    {
                        body: guildCommands.map((command) =>
                            command.data.toJSON()
                        ),
                    }
                );

                console.log(
                    `Successfully registered ${
                        (response as Array<any>).length
                    } commands for guild (${guildId}).`
                );
            }
        } else {
            console.log("No commands found to be registered for guilds.");
        }

        console.log("Completed registering commands.");
    } catch (error) {
        console.error(error);
    }
}

registerCommands();
