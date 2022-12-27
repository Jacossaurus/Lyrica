import { MusicLyrics } from "../types/MusicLyrics";
import { MusicTrack } from "../types/MusicTrack";
import { SpotifyArtistSearch } from "../types/SpotifyArtistSearch";
import { SpotifyPlaylist } from "../types/SpotifyPlaylist";
import { SpotifyTopTracks } from "../types/SpotifyTopTracks";
import { SpotifyTrack } from "../types/SpotifyTrack";
import { SpotifyTrackSearch } from "../types/SpotifyTrackSearch";

const SPOTIFY_API_BASE = "https://api.spotify.com/v1";
const MUSIC_API_BASE = "https://api.musixmatch.com/ws/1.1";

const CACHE_EXPIRY = 7 * 24 * 60 * 60 * 1000;

interface MusicResponse<T> {
	message: {
		header: {
			status_code: number;
			execute_time: number;
		};

		body: T;
	};
}

class MusicService {
	accessToken: {
		access_token: string;
		token_type: string;
		expires_in: number;
		stamp: number;
	};

	cache: { [key: string]: { expiry: number; data: any } } = {};

	get authToken() {
		return `${this.accessToken.token_type} ${this.accessToken.access_token}`;
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

		if (
			this.cache[url] === undefined ||
			this.cache[url]?.expiry < Date.now()
		) {
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

			this.cache[url] = {
				expiry: Date.now() + CACHE_EXPIRY,
				data: response,
			};
		}

		return this.cache[url].data;
	}

	async search(
		query: string = "",
		type: "album" | "artist" | "track" = "artist",
		offset: number = 0,
		limit: number = 25
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

	async getTracks(artistId: string) {
		return (await this.request(
			"Spotify",
			`/artists/${artistId}/top-tracks?market=us`
		)) as SpotifyTopTracks;
	}

	async getLyrics(track: SpotifyTrack) {
		const musicTrack = (await this.request(
			"Music",
			`/track.get?track_isrc=${track.external_ids.isrc}`
		)) as MusicResponse<{ track: MusicTrack }>;

		if (musicTrack.message.body.track.has_lyrics === 0) {
			return false;
		}

		return (
			(await this.request(
				"Music",
				`/track.snippet.get?track_id=${musicTrack.message.body.track.track_id}`
			)) as MusicResponse<MusicLyrics>
		).message.body.snippet.snippet_body;
	}
}

export default new MusicService();
