import { ChildProcessWithoutNullStreams, spawn } from "child_process";
import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import path from "path";

const THIRTY_MINUTES = 30 * 60 * 1000;

const targetGuildIds = [
    "937409042970710046",
    "927342689043771442",
    "777624177523818516",
    "993371911046320248",
];

let running: boolean;
let killing: boolean;
let stamp: number;

let velocityProcess: ChildProcessWithoutNullStreams;
let fabricProcess: ChildProcessWithoutNullStreams;

async function endProcesses() {
    if (
        velocityProcess !== undefined &&
        fabricProcess !== undefined &&
        running &&
        !killing
    ) {
        stamp = Date.now();
        killing = true;

        velocityProcess.stdin.write("end\n");
        velocityProcess.stdin.end();

        fabricProcess.stdin.write("stop\n");
        fabricProcess.stdin.end();

        await new Promise((resolve) => setTimeout(resolve, 15000));

        velocityProcess.kill();
        fabricProcess.kill();

        velocityProcess = undefined;
        fabricProcess = undefined;

        running = false;
        killing = false;

        console.log("Processes are now terminated.");
    }
}

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
                .setMinValue(1)
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

        if (!followUp) {
            await interaction.reply(
                `The Land of Kings server **${signal}** signal has been sent.`
            );
        }

        if (signal === "START") {
            if (
                velocityProcess === undefined &&
                fabricProcess === undefined &&
                !running &&
                !killing
            ) {
                running = true;

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

                velocityProcess.stdout.on("data", (data) => {
                    process.stdout.write(data.toString());
                });

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

                fabricProcess.stdout.on("data", (data) => {
                    process.stdout.write(data.toString());
                });

                await new Promise((resolve) => setTimeout(resolve, 15000));

                await interaction.channel.send(
                    "The Land of Kings is running on **minecraft.mrking.dev**!"
                );

                await interaction.channel.send(
                    `**STOP** signal will be sent in ${time} hours.`
                );
            } else if (running && !killing) {
                await interaction.channel.send(
                    `Process termination delayed for a further ${time} hours.`
                );
            }

            const current = Date.now();

            stamp = current;

            setTimeout(async () => {
                if (stamp === current) {
                    await interaction.channel.send(
                        `${interaction.user} process termination commences in 30 minutes! Delay termination my re-inputting the START signal.`
                    );

                    setTimeout(() => {
                        if (stamp === current) {
                            command.executeSlash(interaction, true);
                        }
                    }, THIRTY_MINUTES);
                }
            }, time * 60 * 60 * 1000 - THIRTY_MINUTES);
        } else if (signal === "STOP") {
            if (running && !killing) {
                await interaction.channel.send(
                    "Terminating Velocity and Fabric server processes."
                );

                await endProcesses();

                await interaction.channel.send(
                    "Processes have been terminated."
                );

                await interaction.channel.send(
                    "The Land of Kings is now **offline**."
                );
            } else if (!running && !killing) {
                await interaction.channel.send(
                    "The processes have already been terminated. Thanks for trying to help though. :)"
                );
            } else if (killing) {
                await interaction.channel.send(
                    "The processes are already undergoing extermination. Thanks for trying to help though. :)"
                );
            }
        }
    },
};

export default command;

process.on("exit", endProcesses);
