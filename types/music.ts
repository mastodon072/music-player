export interface Track {
  id: string;
  uri: string;
  title: string;
  artist: string;
  album: string;
  duration: number; // seconds
  artworkUri?: string;
  isFavourite: boolean;
}

export interface Album {
  id: string;
  title: string;
  artist: string;
  artworkUri?: string;
  year?: number;
}

export interface Artist {
  id: string;
  name: string;
  artworkUri?: string;
}

export interface Playlist {
  id: string;
  name: string;
  createdAt: number;
}
