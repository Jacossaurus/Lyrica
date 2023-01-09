import { REST, Routes } from "discord.js";
import { config } from "dotenv";
import { getCommands } from "./getCommands";

config();

const rest = new REST().setToken(process.env.DISCORD_TOKEN);

async function registerCommands() {
    const commands = await getCommands();

    try {
        console.log(`Attempting to register ${commands.size} commands.`);

        const response = await rest.put(
            Routes.applicationCommands(
                //.applicationGuildCommands(
                process.env.APP_ID
                // process.env.GUILD_ID
            ),
            {
                body: Array.from(commands).map(([i, command]) =>
                    command.data.toJSON()
                ),
            }
        );

        console.log(
            `Successfully registered ${(response as Array<any>).length} command`
        );
    } catch (error) {
        console.error(error);
    }
}

registerCommands();
