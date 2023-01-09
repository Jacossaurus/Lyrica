import {
    AutocompleteInteraction,
    ChatInputCommandInteraction,
    EmbedBuilder,
    SlashCommandBuilder,
} from "discord.js";
import { MusicService } from "../services/MusicService";
import { SpotifyAlbumSearch } from "../types/SpotifyAlbumSearch";
import { SpotifyAlbumTracks } from "../types/SpotifyAlbumTracks";
import { SpotifyArtistSearch } from "../types/SpotifyArtistSearch";
import { SpotifyTrack } from "../types/SpotifyTrack";
import { SpotifyTrackSearch } from "../types/SpotifyTrackSearch";

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

    async execute(interaction: ChatInputCommandInteraction) {
        await interaction.deferReply();

        let track: SpotifyTrack;
        let image: { height: number; width: number; url: string };
        const artistOption = interaction.options.getString("artist");

        if (artistOption !== "") {
            const albums = (await MusicService.getAlbums(
                artistOption
            )) as SpotifyAlbumSearch;

            if (albums?.items !== undefined) {
                const album =
                    albums.items[
                        Math.floor(Math.random() * albums.items.length)
                    ];

                if (album?.id !== undefined) {
                    const tracks = (await MusicService.getTracksByAlbumId(
                        album.id
                    )) as SpotifyAlbumTracks;

                    const trackId =
                        tracks.items[
                            Math.floor(Math.random() * tracks.items.length)
                        ]?.id;

                    if (trackId !== undefined) {
                        track = await MusicService.getTrack(trackId);
                    }
                }
            }
        }

        async function randomSearch() {
            const characters = "abcdefghijklmnopqrstuvwxyz";

            let randomSearchString =
                characters[Math.floor(Math.random() * characters.length)];
            const offset = Math.floor(Math.random() * 1000);

            if (Math.random() > 0.5) {
                randomSearchString = "%" + randomSearchString;
            } else {
                randomSearchString = "%" + randomSearchString + "%";
            }

            const results = (await MusicService.search(
                randomSearchString,
                "track",
                offset,
                50
            )) as SpotifyTrackSearch;

            if (results?.tracks?.items !== undefined) {
                track =
                    results.tracks.items[
                        Math.floor(Math.random() * results.tracks.items.length)
                    ];
            } else {
                await randomSearch();
            }
        }

        if (track?.external_ids?.isrc === undefined) {
            await randomSearch();
        }

        async function doTheEnd() {
            if (track === undefined) {
                await randomSearch();
                await doTheEnd();

                return;
            }

            track.album.images.forEach((i) => {
                if (image === undefined || i.height > image.height) {
                    image = i;
                }
            });

            const lyrics = await MusicService.getLyrics(track);

            if (lyrics) {
                await interaction.followUp({
                    embeds: [
                        new EmbedBuilder()
                            .setTitle(`"${lyrics}"`)
                            .setDescription(
                                `*${track.name} by ${track.artists
                                    .map((artist) => artist.name)
                                    .join(", ")}*`
                            )
                            .setImage(image.url)
                            .setFooter({
                                text: "Lyrics powered by Musixmatch and Spotify.",
                            }),
                    ],
                });
            } else {
                await randomSearch();
                await doTheEnd();
            }
        }

        await doTheEnd();
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
