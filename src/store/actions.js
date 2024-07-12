// import store, { state, dispatch, commit } from "@/store";
import { isAccountLoggedIn, isLooseLoggedIn } from '@/utils/auth';
import { likeATrack } from '@/api/track';
import { getPlaylistDetail } from '@/api/playlist';
import {
  userPlaylist,
  userPlayHistory,
  userLikedSongsIDs,
  likedAlbums,
  likedArtists,
  likedMVs,
  cloudDisk,
  userAccount,
} from '@/api/user';

export default {
  showToast({ state, commit }, text) {
    if (state.toast.timer !== null) {
      clearTimeout(state.toast.timer);
      commit('updateToast', { show: false, text: '', timer: null });
    }
    commit('updateToast', {
      show: true,
      text,
      timer: setTimeout(() => {
        commit('updateToast', {
          show: false,
          text: state.toast.text,
          timer: null,
        });
      }, 3200),
    });
  },
  likeATrack({ state, commit, dispatch }, track) {
    console.log('add', track)


    if (!isAccountLoggedIn()) {
      dispatch('showToast', '此操作需要登录网易云账号');
      return;
    }
    let like = true;
    if (state.liked.songs.includes(track.hash)) {
      like = false
      const song = state.liked.songsWithDetails.filter(song => song.hash === track.hash)[0]
      track.fileid = song.fileid
    };
    likeATrack({ track, like })
      .then(data => {
        if (like === false) {
          commit('updateLikedXXX', {
            name: 'songs',
            data: state.liked.songs.filter(d => d !== track.hash),
          });
          commit('updateLikedXXX', {
            name: 'songsWithDetails',
            data: state.liked.songsWithDetails.filter(d => d.hash !== track.hash),
          });
        } else {
          let newLikeSongs = state.liked.songs;
          newLikeSongs.push(track.hash);
          commit('updateLikedXXX', {
            name: 'songs',
            data: newLikeSongs,
          });
          let newLikeSongsWithDetails = state.liked.songsWithDetails;
          track.fileid = data.data.list_ver;
          console.log(111, newLikeSongsWithDetails.length)
          newLikeSongsWithDetails.push(track);
          console.log(113, newLikeSongsWithDetails.length)

          commit('updateLikedXXX', {
            name: 'songsWithDetails',
            data: newLikeSongsWithDetails,
          });
        }
        // dispatch('fetchLikedSongsWithDetails');
      })
      .catch((e) => {
        dispatch('showToast', '操作失败，专辑下架或版权锁定');
      });
  },
  fetchLikedSongs: ({ state, commit }) => {
    if (!isLooseLoggedIn()) return;
    if (isAccountLoggedIn()) {
      return userLikedSongsIDs(state.data.likedSongPlaylistID).then(result => {
        if (result?.data?.info) {
          const ids = result.data.info.map(item => item.hash);
          commit('updateLikedXXX', {
            name: 'songs',
            data: ids,
          });
        }
      });
    } else {
      // TODO:搜索ID登录的用户
    }
  },
  fetchLikedSongsWithDetails: ({ state, commit }) => {
    return getPlaylistDetail(
      state.data.likedSongPlaylistID,
      true
    ).then(result => {
      if (result.playlist?.tracks?.length === 0) {
        return new Promise(resolve => {
          resolve();
        });
      }
      commit('updateLikedXXX', {
        name: 'songsWithDetails',
        data: result.playlist.tracks,
      });
      return new Promise(resolve => {
        resolve();
      });
    });
  },
  fetchLikedPlaylist: ({ commit }) => {
    if (!isLooseLoggedIn()) return;
    if (isAccountLoggedIn()) {
      return userPlaylist({
        page: 1,
        pagesize: 30, // 最多只加载2000个歌单（等有用户反馈问题再修）
        timestamp: new Date().getTime(),
      }).then(result => {
        if (result.data.info) {
          commit('updateLikedXXX', {
            name: 'playlists',
            data: result.data.info,
          });
          // 更新用户”喜欢的歌曲“歌单ID
          commit('updateData', {
            key: 'likedSongPlaylistID',
            value: result.data.info[1].global_collection_id,
          });
        }
      });
    } else {
      // TODO:搜索ID登录的用户
    }
  },
  fetchLikedAlbums: ({ commit }) => {
    if (!isAccountLoggedIn()) return;
    return likedAlbums({ limit: 2000 }).then(result => {
      if (result.data) {
        commit('updateLikedXXX', {
          name: 'albums',
          data: result.data,
        });
      }
    });
  },
  fetchLikedArtists: ({ commit }) => {
    if (!isAccountLoggedIn()) return;
    return likedArtists({ limit: 2000 }).then(result => {
      if (result.data) {
        commit('updateLikedXXX', {
          name: 'artists',
          data: result.data,
        });
      }
    });
  },
  fetchLikedMVs: ({ commit }) => {
    if (!isAccountLoggedIn()) return;
    return likedMVs({ limit: 1000 }).then(result => {
      if (result.data) {
        commit('updateLikedXXX', {
          name: 'mvs',
          data: result.data,
        });
      }
    });
  },
  fetchCloudDisk: ({ commit }) => {
    if (!isAccountLoggedIn()) return;
    // FIXME: #1242
    return cloudDisk({ limit: 1000 }).then(result => {
      if (result.data) {
        commit('updateLikedXXX', {
          name: 'cloudDisk',
          data: result.data,
        });
      }
    });
  },
  fetchPlayHistory: ({ state, commit }) => {
    if (!isAccountLoggedIn()) return;
    return Promise.all([
      userPlayHistory({ uid: state.data.user?.userId, type: 0 }),
      userPlayHistory({ uid: state.data.user?.userId, type: 1 }),
    ]).then(result => {
      const data = {};
      const dataType = { 0: 'allData', 1: 'weekData' };
      if (result[0] && result[1]) {
        for (let i = 0; i < result.length; i++) {
          const songData = result[i][dataType[i]].map(item => {
            const song = item.song;
            song.playCount = item.playCount;
            return song;
          });
          data[[dataType[i]]] = songData;
        }
        commit('updateLikedXXX', {
          name: 'playHistory',
          data: data,
        });
      }
    });
  },
  fetchUserProfile: ({ commit }) => {
    if (!isAccountLoggedIn()) return;
    return userAccount().then(result => {
      if (result.status === 1) {
        result.data.avatarUrl = result.data.pic
        commit('updateData', { key: 'user', value: result.data });
      }
    });
  },
};
