import store from '@/store';
import request from '@/utils/request';
import { mapTrackPlayableStatus } from '@/utils/common';
import {
  cacheTrackDetail,
  getTrackDetailFromCache,
  cacheLyric,
  getLyricFromCache,
} from '@/utils/db';

/**
 * 获取音乐 url
 * 说明 : 使用歌单详情接口后 , 能得到的音乐的 id, 但不能得到的音乐 url, 调用此接口, 传入的音乐 id( 可多个 , 用逗号隔开 ), 可以获取对应的音乐的 url,
 * !!!未登录状态返回试听片段(返回字段包含被截取的正常歌曲的开始时间和结束时间)
 * @param {string} id - 音乐的 id，例如 id=405998841,33894312
 */
export function getMP3(id) {
  const getQuality = () => {
      const qualityMap = {
    '128000': '128',
    '320000': '320',
    'flac': 'flac',
  };
  const quality = store.state.settings?.musicQuality ?? '320000';
  return qualityMap[quality] || 'high';
  };

  return request({
    url: '/song/url',
    method: 'get',
    params: {
      hash: id,
      quality: getQuality(),
      timestamp: new Date().getTime()
    },
  });
}

/**
 * 获取歌曲详情
 * 说明 : 调用此接口 , 传入音乐 id(支持多个 id, 用 , 隔开), 可获得歌曲详情(注意:歌曲封面现在需要通过专辑内容接口获取)
 * @param {string} ids - 音乐 id, 例如 ids=405998841,33894312
 */
export function getTrackDetail(ids) {
  const fetchLatest = () =>
    request({
      url: '/privilege/lite',
      method: 'get',
      params: { hash: ids },
    }).then(data => {
        const songs = data.data;
        const promises = songs.map(async song => {
          const basename = song.name.replace('.mp3', '');
          const splitnames = basename.split(' - ');
          const songname = splitnames[1].trim();
          song.name = songname;
          song.dt = song.info.duration
          song.ar = [];

          const albumResult = await request({
            url: '/images',
            method: 'get',
            params: { hash: song.hash },
          });

          song.al = {
            id: albumResult?.data?.[0]?.album?.[0]?.album_id || '',
            name: albumResult?.data?.[0]?.album?.[0]?.album_name || '',
            picUrl: albumResult?.data?.[0]?.album?.[0]?.sizable_cover?.replace("{size}", '480') || '',
          };

          albumResult.data[0].author.forEach(singer => {
            song.ar.push({
              id: singer.author_id,
              name: singer.author_name,
            });
          });

          return song;
        });

        return Promise.all(promises).then(songs => ({ songs }));
  });
  fetchLatest();

  let idsInArray = [String(ids)];
  if (typeof ids === 'string') {
    idsInArray = ids.split(',');
  }

  return getTrackDetailFromCache(idsInArray).then(result => {
    if (result) {
      result.songs = mapTrackPlayableStatus(result.songs, result.privileges);
    }
    return result ?? fetchLatest();
  });
}

/**
 * 获取歌词
 * 说明 : 调用此接口 , 传入音乐 id 可获得对应音乐的歌词 ( 不需要登录 )
 * @param {number} id - 音乐 id
 */
export function getLyric(hash) {
  const fetchLatest = () => {
    return request({
      url: '/search/lyric',
      method: 'get',
      params: {
        hash,
      },
    }).then(async result => {
      
     const lc = await request({
        url: '/lyric',
        method: 'get',
        params: {
          id: result.candidates[0].id,
          accesskey: result.candidates[0].accesskey,
          fmt: 'lrc',
          decode: true
        },
      }).then(result => {
        return result.decodeContent;
      })
      cacheLyric(hash, lc);
      return lc;
    });
  };

  fetchLatest();

  return getLyricFromCache(hash).then(result => {
    return result ?? fetchLatest();
  });
}

/**
 * 新歌速递
 * 说明 : 调用此接口 , 可获取新歌速递
 * @param {number} type - 地区类型 id, 对应以下: 全部:0 华语:7 欧美:96 日本:8 韩国:16
 */
export function topSong(type) {
  return request({
    url: '/top/song',
    method: 'get',
    params: {
      type,
    },
  });
}

/**
 * 喜欢音乐
 * 说明 : 调用此接口 , 传入音乐 id, 可喜欢该音乐
 * - id - 歌曲 id
 * - like - 默认为 true 即喜欢 , 若传 false, 则取消喜欢
 * @param {Object} params
 * @param {number} params.id
 * @param {boolean=} [params.like]
 */
export function likeATrack(params) {
  params.timestamp = new Date().getTime();

  const { track, like } = params

  const listid = 2
  const isPersonalFM = store.state.player._isPersonalFM;
  const data = `${track.name}|${track.hash}|${track.album_id}|${track.album_audio_id}`
  if (like) {
    if (isPersonalFM) {
      store.state.player.likeFMTrack('click_red')
    }

    return request({
      url: '/playlist/tracks/add',
      method: 'get',
      params: {
        listid,
        data,
        timestamp: new Date().getTime(),
      },
    });  
  } else {
    if (isPersonalFM) {
      store.state.player.likeFMTrack('cancel_red')
    }

    return request({
      url: '/playlist/tracks/del',
      method: 'get',
      params: {
        listid,
        fileids: track.fileid,
        timestamp: new Date().getTime(),
      },
    });  
  }


}

export function personalFm(mode='normal', song_pool_id = 0, action='play', isOverPlay = true, playtime = 0) {

  const track = undefined

  const params = {
    hash: track?.hash,
    mode,
    song_pool_id,
    action,
    playtime,
    isOverPlay,
  }

  return request({
    url: '/personal/fm',
    method: 'post',
    params,
  })
}

/**
 * 听歌打卡
 * 说明 : 调用此接口 , 传入音乐 id, 来源 id，歌曲时间 time，更新听歌排行数据
 * - id - 歌曲 id
 * - sourceid - 歌单或专辑 id
 * - time - 歌曲播放时间,单位为秒
 * @param {Object} params
 * @param {number} params.id
 * @param {number} params.sourceid
 * @param {number=} params.time
 */
export function scrobble(params) {
  params.timestamp = new Date().getTime();
  return request({
    url: '/scrobble',
    method: 'get',
    params,
  });
}
