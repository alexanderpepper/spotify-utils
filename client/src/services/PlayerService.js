import BaseService from './BaseService'
import api from '../constants/api.js'
import repeatModes from '../constants/repeat-modes'
import DateService from './DateService'
import PlaylistService from './PlaylistService'

class PlayerService extends BaseService {
  static play (uris, position) {
    if (uris) {
      return this.POST(api.play, { uris, offset: { position } })
    } else {
      return this.POST(api.play)
    }
  }

  static async shuffleFolder (folder, playlistLoadedCallback) {
    const playlists = await Promise.all(this.flatten(folder.children).map(item => {
      return PlaylistService.getPlaylistThrottled(item.data.id).then(playlist => {
        playlistLoadedCallback(playlist)
        return playlist
      })
    }))
    let uris = playlists.map(playlist => playlist.tracks.items
      .filter(item => !item.is_local)
      .map(item => item.track.uri))
      .reduce((acc, cur) => acc.concat(cur), [])
    uris = this.randomize(uris).slice(0, 740) // 740 is about the limit
    await this.setShuffle(true)
    return this.play(uris, 0)
  }

  static randomize (array) {
    let temporaryValue
    let randomIndex
    let currentIndex = array.length

    while (currentIndex !== 0) {
      randomIndex = Math.floor(Math.random() * currentIndex)
      currentIndex -= 1
      temporaryValue = array[currentIndex]
      array[currentIndex] = array[randomIndex]
      array[randomIndex] = temporaryValue
    }

    return array
  }

  static flatten (children) {
    let result = []
    children.forEach(child => {
      if (child.isLeaf) {
        result.push(child)
      } else if (Array.isArray(child.children)) {
        result = result.concat(this.flatten(child.children))
      }
    })
    return result
  }

  static pause () {
    return this.POST(api.pause)
  }

  static next () {
    return this.POST(api.next)
  }

  static previous () {
    return this.POST(api.previous)
  }

  static setShuffle (shuffle) {
    return this.POST(api.setShuffle, { shuffle })
  }

  static setRepeat (repeat) {
    return this.POST(api.setRepeat, { repeat })
  }

  static setVolume (volume) {
    return this.POST(api.setVolume, { volume })
  }

  static seek (position) {
    return this.POST(api.seek, { position })
  }

  static transferPlayback (deviceID, play) {
    const realPlay = typeof play === 'boolean' ? play : false
    return this.POST(api.transferPlayback(deviceID, realPlay))
  }

  static getDevices () {
    return this.GET(api.devices).then(results => results.devices)
  }

  static getPlayerState () {
    return this.GET(api.playerState)
  }

  static initialPlayerState () {
    return {
      paused: true,
      repeat: repeatModes.off,
      shuffle: false,
      position: 0,
      track: 'Track Name',
      artist: 'Artist Name',
      images: [{}],
      elapsed: '00:00',
      duration: '00:00',
      durationMs: 0,
      volume: 50
    }
  }

  static parsePlayerState (previousState, state) {
    let playerState = previousState

    if (state) {
      playerState = {
        ...playerState,
        paused: !state.is_playing,
        shuffle: state.shuffle_state,
        repeat: state.repeat_state
      }

      if (state.item) {
        playerState = {
          ...playerState,
          position: (state.progress_ms / state.item.duration_ms) * 100,
          track: state.item.name,
          trackId: state.item.id,
          artist: state.item.artists[0].name,
          images: state.item.album.images,
          elapsed: DateService.formattedDuration(state.progress_ms),
          duration: DateService.formattedDuration(state.item.duration_ms),
          durationMs: state.item.duration_ms
        }
      }

      if (state.device) {
        playerState = {
          ...playerState,
          volume: state.device.volume,
          device: state.device.name
        }
      }
    }
    return playerState
  }
}

export default PlayerService
