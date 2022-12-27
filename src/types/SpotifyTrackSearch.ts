import { SpotifyTrack } from "./SpotifyTrack";

export interface SpotifyTrackSearch {
	tracks: {
		href: string;
		items: Array<SpotifyTrack>;
		limit: number;
		next: string;
		offset: number;
		previous: string;
		total: number;
	};
}
