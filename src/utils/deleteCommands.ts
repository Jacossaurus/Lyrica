import { REST, Routes } from "discord.js";
import { config } from "dotenv";
import { getCommands } from "./getCommands";

config();

const rest = new REST().setToken(process.env.DISCORD_TOKEN);

async function deleteCommands() {
    console.log("Attempting to delete global commands.");

    await rest.put(Routes.applicationCommands(process.env.APP_ID), {
        body: [],
    });

    console.log("Deleted global commands.");

    const commands = await getCommands();
    const guilds: string[] = [];

    commands.forEach((command) => {
        if (command.targetGuildIds !== undefined) {
            command.targetGuildIds.forEach((guildId) => guilds.push(guildId));
        }
    });

    for (const guildId of guilds) {
        console.log(`Attempting to delete guild (${guildId}) commands.`);

        await rest.put(
            Routes.applicationGuildCommands(process.env.APP_ID, guildId),
            { body: [] }
        );

        console.log(`Deleted guild (${guildId}) commands.`);
    }

    console.log("Completed deletion of commands.");
}

deleteCommands();
