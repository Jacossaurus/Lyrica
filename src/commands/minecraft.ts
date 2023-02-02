import { ChildProcessWithoutNullStreams, spawn } from "child_process";
import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import path from "path";

const targetGuildIds = [
    "937409042970710046",
    "927342689043771442",
    "777624177523818516",
    "993371911046320248",
];

let stopSignalTimeout: NodeJS.Timeout;

let velocityProcess: ChildProcessWithoutNullStreams;
let fabricProcess: ChildProcessWithoutNullStreams;

const command = {
    data: new SlashCommandBuilder()
        .setName("minecraft")
        .setDescription("Lyrica starts The Land of Kings server.")
        .addStringOption((option) =>
            option
                .setName("signal")
                .setDescription("Specify the signal given to the process.")
                .setRequired(true)
                .addChoices(
                    { name: "START", value: "START" },
                    { name: "STOP", value: "STOP" }
                )
        )
        .addIntegerOption((option) =>
            option
                .setName("time")
                .setDescription(
                    "Specify the amount of time (in hours) before the process is terminated."
                )
                .setMaxValue(6)
        ),

    targetGuildIds,

    async executeSlash(
        interaction: ChatInputCommandInteraction,
        followUp?: boolean
    ) {
        const signal = !followUp
            ? interaction.options.getString("signal")
            : "STOP";
        const time = !followUp
            ? Math.min(interaction.options.getInteger("time") || 3, 6)
            : 0;

        await interaction.reply(
            `The Land of Kings server **${signal}** signal has been sent.`
        );

        if (signal === "START") {
            if (velocityProcess === undefined && fabricProcess === undefined) {
                const velocityPath = process.env.VELOCITY_PATH;
                const fabricPath = process.env.FABRIC_PATH;

                await interaction.channel.send("Starting Velocity process.");

                velocityProcess = spawn(
                    "bash",
                    [path.join(velocityPath, "start.sh")],
                    {
                        cwd: velocityPath,
                    }
                );

                await interaction.channel.send(
                    "Starting Fabric server process."
                );

                fabricProcess = spawn(
                    "bash",
                    [path.join(fabricPath, "run.sh")],
                    {
                        cwd: fabricPath,
                    }
                );

                await interaction.channel.send(
                    "The Land of Kings is running on **minecraft.mrking.dev**!"
                );

                await interaction.channel.send(
                    `**STOP** signal will be sent in ${time} hours.`
                );

                velocityProcess.stdout.on("data", (data) => {
                    console.log(
                        `VELOCITY: ${process.stdout.write(data.toString())}`
                    );
                });

                fabricProcess.stdout.on("data", (data) => {
                    console.log(
                        `FABRIC: ${process.stdout.write(data.toString())}`
                    );
                });
            } else if (stopSignalTimeout !== undefined) {
                clearTimeout(stopSignalTimeout);

                stopSignalTimeout = undefined;

                await interaction.channel.send(
                    `Process termination delayed for a further ${time} hours.`
                );
            }

            stopSignalTimeout = setTimeout(
                () => command.executeSlash(interaction, true),
                time * 60 * 60 * 1000
            );
        } else if (signal === "STOP") {
            velocityProcess.stdin.write("end");
            fabricProcess.stdin.write("stop");

            velocityProcess = undefined;
            fabricProcess = undefined;

            await interaction.channel.send("The Land of Kings is now offline.");

            await interaction.channel.send("Processes have been terminated.");
        }
    },
};

export default command;

process.on("exit", () => {
    velocityProcess?.stdin.write("end");
    fabricProcess?.stdin.write("stop");

    velocityProcess?.kill();
    fabricProcess?.kill();
});
