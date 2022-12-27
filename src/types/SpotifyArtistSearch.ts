export interface SpotifyArtistSearch {
	artists: {
		href: string;
		items: Array<{
			external_urls: {
				spotify: string;
			};
			followers: { href: string; total: number };
			genres: string[];
			href: string;
			id: string;
			images: Array<{
				height: number;
				width: number;
				url: string;
			}>;
			name: string;
			popularity: number;
			type: string;
			uri: string;
		}>;
		limit: number;
		next: string;
		offset: number;
		previous: string;
		total: number;
	};
}
