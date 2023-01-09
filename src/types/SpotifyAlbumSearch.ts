export interface SpotifyAlbumSearch {
    href: string;
    items: Array<{
        album_group: string;
        album_type: string;
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
        release_data: string;
        release_date_precision: string;
        total_tracks: number;
        type: string;
        uri: string;
    }>;
    limit: number;
    next: string;
    offset: number;
    previous: string;
    total: number;
}
