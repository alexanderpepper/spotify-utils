import BaseService from './BaseService'
import api from '../constants/api.js'
import repeatModes from '../constants/repeat-modes'
import DateService from './DateService'
import PlaylistService from './PlaylistService'

let pauseStateUpdates = false

class PlayerService extends BaseService {
  static play (uris, position) {
    if (uris) {
      return this.POST(api.play, {uris, offset: {position}})
    } else {
      return this.POST(api.play)
    }
  }

  static async shuffleFolder (folder, playlistLoadedFn) {
    pauseStateUpdates = true
    const children = this.flatten(folder.children)
    const playlists = await Promise.all(children.map(item => PlaylistService.getPlaylistThrottled(item.data.id).then(playlist => {
      playlistLoadedFn(playlist)
      return playlist
    })))
    let uris = playlists.map(playlist => playlist.tracks.items.map(item => item.track.uri)).reduce((acc, cur) => acc.concat(cur), []).slice(0, 740) // 740 is about the limit
    await this.setShuffle(true)
    pauseStateUpdates = false
    return this.play(uris, 0)
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
    return this.POST(api.setShuffle, {shuffle})
  }

  static setRepeat (repeat) {
    return this.POST(api.setRepeat, {repeat})
  }

  static setVolume (volume) {
    return this.POST(api.setVolume, {volume})
  }

  static seek (position) {
    return this.POST(api.seek, {position})
  }

  static transferPlayback (deviceID, play) {
    const realPlay = typeof play === 'boolean' ? play : false
    return this.POST(api.transferPlayback(deviceID, realPlay))
  }

  static getDevices () {
    if (pauseStateUpdates) return
    return this.GET(api.devices).then(results => results.devices)
  }

  static getPlayerState () {
    if (pauseStateUpdates) return
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
