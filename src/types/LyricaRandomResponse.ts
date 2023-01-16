import { SpotifyTrack } from "./SpotifyTrack";

export interface LyricaRandomResponse {
    lyrics: string | false;
    track: SpotifyTrack;
    image: {
        height: number;
        width: number;
        url: string;
    };
}
