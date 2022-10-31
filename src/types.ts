import { required } from './util'

export class Album {
    artist: string
    album: string
    year: number
    label: string
    type: 'LP' | 'EP' | 'S'

    constructor(partial: Partial<Album>) {
        this.artist = required(partial.artist)
        this.album = required(partial.album)
        this.year = required(partial.year)
        this.label = required(partial.label)
        this.type = required(partial.type)
    }
}

export class Song {
    track: number
    title: string

    constructor(partial: Partial<Song>) {
        this.track = required(partial.track)
        this.title = required(partial.title)
    }
}

export type AlbumDetail = Album & {
    tracks: Song[]
}

export type DynamoItem = { pk: string; sk: string }
export type AlbumItem = Omit<Album, 'songs'> & DynamoItem
export type SongItem = Song & DynamoItem
