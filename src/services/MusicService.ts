import { LyricaRandomResponse } from "../types/LyricaRandomResponse";
import { MusicLyrics } from "../types/MusicLyrics";
import { MusicTrack } from "../types/MusicTrack";
import { SpotifyAlbumSearch } from "../types/SpotifyAlbumSearch";
import { SpotifyAlbumTracks } from "../types/SpotifyAlbumTracks";
import { SpotifyArtistSearch } from "../types/SpotifyArtistSearch";
import { SpotifyPlaylist } from "../types/SpotifyPlaylist";
import { SpotifyTopTracks } from "../types/SpotifyTopTracks";
import { SpotifyTrack } from "../types/SpotifyTrack";
import { SpotifyTrackSearch } from "../types/SpotifyTrackSearch";

const SPOTIFY_API_BASE = "https://api.spotify.com/v1";
const MUSIC_API_BASE = "https://api.musixmatch.com/ws/1.1";

const CACHE_EXPIRY = 7 * 24 * 60 * 60 * 1000;
const RANDOM_CACHE_MAX = 10;

interface MusicResponse<T> {
    message: {
        header: {
            status_code: number;
            execute_time: number;
        };

        body: T;
    };
}

class Music {
    accessToken: {
        access_token: string;
        token_type: string;
        expires_in: number;
        stamp: number;
    };

    cache: Map<string, { expiry: number; data: any } | undefined> = new Map();
    randomCache: Array<LyricaRandomResponse> = [];

    get authToken() {
        return `${this.accessToken.token_type} ${this.accessToken.access_token}`;
    }

    async init() {
        await this.authenticate();

        await this.refresh();
    }

    async authenticate() {
        const body = {
            grant_type: "client_credentials",
        };

        const response = await fetch(`https://accounts.spotify.com/api/token`, {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
                Authorization:
                    "Basic " +
                    Buffer.from(
                        process.env.SPOTIFY_CLIENT_ID +
                            ":" +
                            process.env.SPOTIFY_CLIENT_SECRET
                    ).toString("base64"),
            },

            body: Object.keys(body)
                .map(
                    (key) =>
                        encodeURIComponent(key) +
                        "=" +
                        encodeURIComponent(body[key])
                )
                .join("&"),
        });

        const data = await response.json();

        data.stamp = Date.now() + data.expires_in;

        this.accessToken = data;
    }

    async request(type: "Spotify" | "Music", queries: string) {
        const url = `${
            type === "Spotify" ? SPOTIFY_API_BASE : MUSIC_API_BASE
        }${queries}`;

        const entry = this.cache.get(url);

        if (entry === undefined || entry?.expiry < Date.now()) {
            let response: any;

            if (type === "Spotify") {
                if (
                    this.accessToken === undefined ||
                    this.accessToken?.stamp < Date.now()
                ) {
                    await this.authenticate();
                }

                response = await (
                    await fetch(url, {
                        headers: {
                            "Content-Type": "application/json",
                            Authorization: this.authToken,
                        },
                    })
                ).json();
            } else if (type === "Music") {
                response = await (
                    await fetch(`${url}&apikey=${process.env.MUSIC_API_KEY}`)
                ).json();
            }

            this.cache.set(url, {
                expiry: Date.now() + CACHE_EXPIRY,
                data: response,
            });
        }

        return this.cache.get(url).data;
    }

    async search(
        query = "",
        type: "album" | "artist" | "track" = "artist",
        offset = 0,
        limit = 25
    ) {
        const response = await this.request(
            "Spotify",
            `/search?q=${encodeURIComponent(
                query
            )}&type=${type}&offset=${offset}&limit=${limit}&market=US`
        );

        if (type === "artist") {
            return response as SpotifyArtistSearch;
        } else if (type === "track") {
            return response as SpotifyTrackSearch;
        }
    }

    async getPlaylist(playlistId: string) {
        return (await this.request(
            "Spotify",
            `/playlists/${playlistId}`
        )) as SpotifyPlaylist;
    }

    async getAlbums(artistId: string) {
        return await this.request(
            "Spotify",
            `/artists/${artistId}/albums?limit=50&market=us&include_groups=album`
        );
    }

    async getTopTracks(artistId: string) {
        return (await this.request(
            "Spotify",
            `/artists/${artistId}/top-tracks?market=us`
        )) as SpotifyTopTracks;
    }

    async getTrack(trackId: string) {
        return (await this.request(
            "Spotify",
            `/tracks/${trackId}?market=us`
        )) as SpotifyTrack;
    }

    async getTracksByAlbumId(albumId: string) {
        return await this.request(
            "Spotify",
            `/albums/${albumId}/tracks?limit=50&market=us`
        );
    }

    async getLyrics(track: SpotifyTrack) {
        const musicTrack = (await this.request(
            "Music",
            `/track.get?track_isrc=${track.external_ids.isrc}`
        )) as MusicResponse<{ track: MusicTrack }>;

        const hasLyrics = musicTrack?.message?.body?.track?.has_lyrics;

        if (hasLyrics === undefined || hasLyrics === 0) {
            return false;
        }

        return (
            (await this.request(
                "Music",
                `/track.snippet.get?track_id=${musicTrack?.message.body.track.track_id}`
            )) as MusicResponse<MusicLyrics>
        ).message.body.snippet.snippet_body;
    }

    async getRandom(artistOption?: string) {
        let track: SpotifyTrack;
        let image: { height: number; width: number; url: string };

        if (artistOption !== undefined && artistOption !== "") {
            let albums = (await this.getAlbums(
                artistOption
            )) as SpotifyAlbumSearch;

            if (albums?.items === undefined) {
                const artists = (await MusicService.search(
                    artistOption
                )) as SpotifyArtistSearch;

                if (
                    artists?.artists?.items !== undefined &&
                    artists.artists.items.length > 0
                ) {
                    albums = (await this.getAlbums(
                        artists.artists.items[0].id
                    )) as SpotifyAlbumSearch;
                }
            }

            if (albums?.items !== undefined) {
                const album =
                    albums.items[
                        Math.floor(Math.random() * albums.items.length)
                    ];

                if (album?.id !== undefined) {
                    const tracks = (await this.getTracksByAlbumId(
                        album.id
                    )) as SpotifyAlbumTracks;

                    const trackId =
                        tracks.items[
                            Math.floor(Math.random() * tracks.items.length)
                        ]?.id;

                    if (trackId !== undefined) {
                        track = await this.getTrack(trackId);
                    }
                }
            }
        }

        const randomSearch = async () => {
            const characters = "abcdefghijklmnopqrstuvwxyz";

            let randomSearchString =
                characters[Math.floor(Math.random() * characters.length)];
            const offset = Math.floor(Math.random() * 1000);

            if (Math.random() > 0.5) {
                randomSearchString = "%" + randomSearchString;
            } else {
                randomSearchString = "%" + randomSearchString + "%";
            }

            const results = (await this.search(
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
        };

        if (track?.external_ids?.isrc === undefined) {
            await randomSearch();
        }

        const doTheEnd = async () => {
            if (track === undefined) {
                await randomSearch();

                return await doTheEnd();
            }

            image = undefined;

            track.album.images.forEach((i) => {
                if (image === undefined || i.height > image.height) {
                    image = i;
                }
            });

            const lyrics = await this.getLyrics(track);

            if (lyrics && track && image) {
                return {
                    lyrics,
                    track,
                    image,
                };
            } else {
                await randomSearch();

                return await doTheEnd();
            }
        };

        return await doTheEnd();
    }

    async refresh() {
        while (this.randomCache.length < RANDOM_CACHE_MAX) {
            this.randomCache.push(await this.getRandom());
        }
    }
}

export const MusicService = new Music();
