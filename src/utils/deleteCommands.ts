import { REST, Routes } from "discord.js";
import { config } from "dotenv";

config();

const rest = new REST().setToken(process.env.DISCORD_TOKEN);

rest.put(
	Routes.applicationGuildCommands(process.env.APP_ID, process.env.GUILD_ID),
	{ body: [] }
)
	.then(() => console.log("Deleted all registered commands."))
	.catch((error) => console.error(error));
