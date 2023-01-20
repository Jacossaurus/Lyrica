import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonInteraction,
    ButtonStyle,
    ChatInputCommandInteraction,
    PermissionFlagsBits,
    SlashCommandBuilder,
    StringSelectMenuBuilder,
    StringSelectMenuInteraction,
} from "discord.js";
import { deleteReply } from "../utils/deleteReply";

export default {
    data: new SlashCommandBuilder()
        .setName("settings")
        .setDescription("Change Lyrica's settings.")
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async executeSlash(interaction: ChatInputCommandInteraction) {
        const row =
            new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
                new StringSelectMenuBuilder()
                    .setCustomId("settingSelect")
                    .setPlaceholder("No setting selected.")
                    .setMinValues(1)
                    .setMaxValues(1)
                    .addOptions([
                        {
                            label: "Explicit Lyrics",
                            description:
                                "If enabled, explicit lyrics may be sent by Lyrica.",
                            value: "explicitLyrics",
                        },
                    ])
            );

        await interaction.reply({
            content: "Please select a setting you would like to change.",
            components: [row],
            ephemeral: true,
        });
    },

    interactions: {
        async settingSelect(interaction: StringSelectMenuInteraction) {
            const selected = interaction.values[0];

            if (selected === "explicitLyrics") {
                const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
                    new ButtonBuilder()
                        .setCustomId("enableExplicitLyrics")
                        .setLabel("Enable")
                        .setStyle(ButtonStyle.Primary),
                    new ButtonBuilder()
                        .setCustomId("disableExplicitLyrics")
                        .setLabel("Disable")
                        .setStyle(ButtonStyle.Danger)
                );

                await interaction.update({
                    content:
                        "Please choose whether to enable or disable Explicit Lyrics.",
                    components: [row],
                });
            } else {
                await interaction.update({
                    content: "Failed to get setting interaction callback.",
                    components: [],
                });
            }
        },

        async enableExplicitLyrics(interaction: ButtonInteraction) {
            await interaction.update({
                content:
                    "Explicit Lyrics has been enabled! Lyrica can now say fuck. :)",
                components: [],
            });

            deleteReply(interaction);
        },

        async disableExplicitLyrics(interaction: ButtonInteraction) {
            await interaction.update({
                content:
                    "Explicit Lyrics has been disabled! Lyrica cannot say no-no words. :(",
                components: [],
            });

            setTimeout(async () => {
                await interaction.editReply({
                    content: "Sike- I can still say fuck.",
                    components: [],
                });

                deleteReply(interaction);
            }, 3000);
        },
    },
};
