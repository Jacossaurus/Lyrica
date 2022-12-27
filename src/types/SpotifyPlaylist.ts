import { SpotifyTrack } from "./SpotifyTrack";

export interface SpotifyPlaylist {
	collaborative: false;
	description: string;
	external_urls: {
		spotify: string;
	};
	followers: { href: string; total: number };
	href: string;
	id: string;
	images: Array<{
		height: number;
		width: number;
		url: string;
	}>;
	name: string;
	owner: {
		display_name: string;
		external_urls: {
			spotify: string;
		};
		href: string;
		id: string;
		type: string;
		uri: string;
	};
	primary_color: string;
	public: boolean;
	snapshot_id: string;
	tracks: {
		href: string;
		items: Array<{
			added_at: string;
			added_by: {
				external_urls: {
					spotify: string;
				};
				href: string;
				id: string;
				type: string;
				uri: string;
			};
			is_local: boolean;
			primary_color: string;
			track: SpotifyTrack;
		}>;
		limit: 100;
		next: string;
		offset: number;
		previous: string;
		total: number;
	};
	type: string;
	uri: string;
}
