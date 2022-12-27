export interface SpotifyTrack {
	album: {
		album_type: string;
		artists: Array<any>;
		available_markets: Array<string>;
		external_urls: {
			spotify: string;
		};
		href: string;
		id: string;
		images: Array<{
			height: number;
			width: number;
			url: string;
		}>;
		name: string;
		release_date: string;
		release_data_precision: string;
		total_tracks: number;
		type: string;
		uri: string;
	};
	artists: Array<{
		external_urls: {
			spotify: string;
		};
		href: string;
		id: string;
		name: string;
		type: string;
		uri: string;
	}>;
	available_markets: Array<string>;
	disc_number: number;
	duration_ms: number;
	episode: boolean;
	explicit: boolean;
	external_ids: { isrc: string };
	external_urls: {
		spotify: string;
	};
	href: string;
	id: string;
	is_local: boolean;
	name: string;
	popularity: number;
	preview_url: string;
	track: boolean;
	track_number: number;
	type: string;
	uri: string;
}
