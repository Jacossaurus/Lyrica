import {
    AutocompleteInteraction,
    Channel,
    ChatInputCommandInteraction,
    EmbedBuilder,
    Message,
    SlashCommandBuilder,
} from "discord.js";
import { MusicService } from "../services/MusicService";
import { LyricaRandomResponse } from "../types/LyricaRandomResponse";
import { SpotifyArtistSearch } from "../types/SpotifyArtistSearch";

export default {
    data: new SlashCommandBuilder()
        .setName("random")
        .setDescription("Lyrica will give lyrics from a random song!")
        .addStringOption((option) =>
            option
                .setName("artist")
                .setDescription("Specify an artist to get random songs from.")
                .setAutocomplete(true)
                .setMaxLength(30)
        ),

    async executeSlash(interaction: ChatInputCommandInteraction) {
        const artistOption = interaction.options.getString("artist");
        let data: LyricaRandomResponse;

        if (
            MusicService.randomCache.length > 0 &&
            (!artistOption || artistOption === "")
        ) {
            data = MusicService.randomCache[0];

            MusicService.randomCache.splice(0, 1);
        } else {
            await interaction.deferReply();

            data = await MusicService.getRandom(artistOption);
        }

        const embed = {
            embeds: [
                new EmbedBuilder()
                    .setTitle(`"${data.lyrics}"`)
                    .setDescription(
                        `*${data.track.name} by ${data.track.artists
                            .map((artist) => artist.name)
                            .join(", ")}*`
                    )
                    .setImage(data.image.url)
                    .setFooter({
                        text: "Lyrics powered by Musixmatch and Spotify.",
                    }),
            ],
        };

        if (interaction.deferred) {
            await interaction.followUp(embed);
        } else {
            await interaction.reply(embed);
        }

        MusicService.refresh();
    },

    async executeInformal(message: Message) {
        const options = message.content.split(" ");
        options.splice(0, 1);

        const artistOption = options.join(" ");

        let data: LyricaRandomResponse;

        if (
            MusicService.randomCache.length > 0 &&
            (!artistOption || artistOption === "")
        ) {
            data = MusicService.randomCache[0];

            MusicService.randomCache.splice(0, 1);
        } else {
            data = await MusicService.getRandom(artistOption);
        }

        const embed = {
            embeds: [
                new EmbedBuilder()
                    .setTitle(`"${data.lyrics}"`)
                    .setDescription(
                        `*${data.track.name} by ${data.track.artists
                            .map((artist) => artist.name)
                            .join(", ")}*
							
							on ${data.track.album.name}`
                    )
                    .setImage(data.image.url)
                    .setFooter({
                        text: "Lyrics powered by Musixmatch and Spotify.",
                    }),
            ],
        };

        await message.channel.send(embed);

        MusicService.refresh();
    },

    async autocomplete(interaction: AutocompleteInteraction) {
        const focus = interaction.options.getFocused(true);
        let choices: Array<{ name: string; value: string }> = [];

        if (focus.name === "artist") {
            if (focus.value !== "") {
                choices = (
                    (await MusicService.search(
                        focus.value
                    )) as SpotifyArtistSearch
                ).artists.items.map((artist) => {
                    return { name: artist.name, value: artist.id };
                });
            } else {
                (
                    await MusicService.getPlaylist("37i9dQZEVXbMDoHDwVN2tF")
                ).tracks.items.forEach((song) => {
                    song.track.artists.forEach((artist) => {
                        if (
                            choices.find(
                                (choice) => choice.value === artist.id
                            ) === undefined
                        ) {
                            choices.push({
                                name: artist.name,
                                value: artist.id,
                            });
                        }
                    });
                });
            }
        }

        await interaction.respond(
            choices
                .filter((choice) =>
                    choice.name
                        .toLowerCase()
                        .startsWith(focus.value.toLowerCase())
                )
                .slice(0, 25)
        );
    },
};
