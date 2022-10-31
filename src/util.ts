import { Album, AlbumDetail, AlbumItem, Song, SongItem } from './types'
import { DynamoDBDocument } from '@aws-sdk/lib-dynamodb'
import { DynamoDB } from '@aws-sdk/client-dynamodb'
import { albums } from './albums'

// Dynamo
export const tableName = 'single_table_design'
export const artistAlbumsIndex = 'artist-albums'
export const client = new DynamoDB({})
export const dynamo = DynamoDBDocument.from(client)

export const required = <T = any>(value: T | null | undefined): T => {
    if (value === null || value === undefined) {
        throw new Error('Value is required')
    }
    return value as T
}

export const run = async () => {
    const discography = await albumsByArtist('The Weekend')
    console.log('Discography', discography)

    const album = await albumDetail('The Weekend', 'Starboy')
    console.log('The Weekend - Starboy', album)
    return { discography, album }
}

export const albumsByArtist = async (artist: string): Promise<Album[]> => {
    const items = await dynamo.query({
        TableName: tableName,
        IndexName: artistAlbumsIndex,
        KeyConditionExpression: 'artist_key = :artist',
        ExpressionAttributeValues: {
            ':artist': artist.toLowerCase(),
        },
        ScanIndexForward: false,
    })
    return items?.Items?.map((i: Partial<Album>) => new Album(i)) || []
}

const albumDetail = async (artist: string, album: string): Promise<AlbumDetail> => {
    const items = await dynamo.query({
        TableName: tableName,
        KeyConditionExpression: 'pk = :pk',
        ExpressionAttributeValues: {
            ':pk': `ALBUM#${artist.toLowerCase()}#${album.toLowerCase()}`,
        },
        ScanIndexForward: false,
    })

    const found = { songs: [] } as { album?: Album; songs: Song[] }
    items?.Items?.forEach((i: any) => {
        if (i.sk.startsWith('ALBUM#')) {
            found.album = new Album(i)
        } else {
            found.songs.push(new Song(i))
        }
    })

    required(found.album)
    return {
        ...found.album!,
        tracks: found.songs.sort((s1, s2) => s1.track - s2.track),
    }
}

export const saveAlbum = async (album: AlbumDetail) => {
    await dynamo.transactWrite({
        TransactItems: [
            {
                Put: {
                    TableName: tableName,
                    Item: {
                        pk: `ALBUM#${album.artist.toLowerCase()}#${album.album.toLowerCase()}`,
                        sk: `ALBUM#${album.artist.toLowerCase()}#${album.album.toLowerCase()}`,
                        artist: album.artist,
                        artist_key: album.artist.toLowerCase(),
                        album: album.album,
                        year: album.year,
                        label: album.label,
                        type: album.type,
                    } as AlbumItem,
                },
            },
            ...album.tracks.map((song) => ({
                Put: {
                    TableName: tableName,
                    Item: {
                        pk: `ALBUM#${album.artist.toLowerCase()}#${album.album.toLowerCase()}`,
                        sk: `SONG#${song.track}`,
                        track: song.track,
                        title: song.title,
                    } as SongItem,
                },
            })),
        ],
    })
}

export const seed = async () => {
    const promises = albums.map(async (it) => await saveAlbum(it))
    await Promise.all(promises)
}

export const seedsDontExists = async () => {
    const albums = await albumsByArtist('The Weekend')
    return albums && albums.length === 0
}
