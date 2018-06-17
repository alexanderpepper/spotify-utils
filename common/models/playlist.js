'use strict'

const SpotifyService = require('../../server/services/spotify-service')
const remoteDefaults = require('../../server/constants/remote-defaults')

module.exports = (Playlist) => {
  Playlist.beforeRemote('*', (ctx, unused, next) => Playlist.app.models.AppUser.getUserWithFreshToken(ctx, next))

  Playlist.playlists = (options) => SpotifyService.getPlaylists(options.user)
  Playlist.remoteMethod('playlists', {
    ...remoteDefaults.method,
    http: {path: '/', verb: 'get'}
  })

  Playlist.playlist = (playlistID, options) => SpotifyService.getPlaylist(options.user, playlistID)
  Playlist.remoteMethod('playlist', {
    ...remoteDefaults.method,
    accepts: [
      {arg: 'playlistID', type: 'string'},
      remoteDefaults.options
    ],
    http: {path: '/:playlistID', verb: 'get'}
  })
}