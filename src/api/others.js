import request from '@/utils/request';
import { mapTrackPlayableStatus } from '@/utils/common';

/**
 * 搜索
 * 说明 : 调用此接口 , 传入搜索关键词可以搜索该音乐 / 专辑 / 歌手 / 歌单 / 用户 , 关键词可以多个 , 以空格隔开 ,
 * 如 " 周杰伦 搁浅 "( 不需要登录 ), 搜索获取的 mp3url 不能直接用 , 可通过 /song/url 接口传入歌曲 id 获取具体的播放链接
 * - keywords : 关键词
 * - limit : 返回数量 , 默认为 30
 * - offset : 偏移数量，用于分页 , 如 : 如 :( 页数 -1)*30, 其中 30 为 limit 的值 , 默认为 0
 * - type: 搜索类型；默认为 1 即单曲 , 取值意义 : 1: 单曲, 10: 专辑, 100: 歌手, 1000: 歌单, 1002: 用户, 1004: MV, 1006: 歌词, 1009: 电台, 1014: 视频, 1018:综合
 * - 调用例子 : /search?keywords=海阔天空 /cloudsearch?keywords=海阔天空(更全)
 * @param {Object} params
 * @param {string} params.keywords
 * @param {number=} params.limit
 * @param {number=} params.offset
 * @param {number=} params.type
 */
export function search(params) {
  return request({
    url: '/search',
    method: 'get',
    params,
  }).then(data => {
    if (data.result?.song !== undefined)
      data.result.song.songs = mapTrackPlayableStatus(data.result.song.songs);
    return data;
  });
}

/**
 * 私人 FM
 * 说明 : 调用此接口 , 可获取私人 FM 列表
 * - hash : 当前播放歌曲的 hash
 * - songid : 当前播放歌曲的 id
 * - mode : 模式，normal：发现，small: 小众，peak: 30s
 * - action : 模式，play：播放，garbage：不喜欢
 * - song_pool_id : 推荐模式，0: Alpha，1：Beta，2：Gamma
 * - is_overplay : 是否结束播放，0：否，1：是
 * - playtime : 播放时长，单位：秒
 * - remain_songcnt : 剩余歌曲数量
 * @param {string} hash 
 * @param {number} songid 
 * @param {string} mode 
 * @param {string} action 
 * @param {number} songPoolId 
 * @param {number} isOverplay 
 * @param {number} playtime 
 * @param {number} remainSongCnt 
 * @returns 
 */
export function personalFM(
  hash,
  songid,
  mode = 'normal',
  action = 'play',
  songPoolId = 0,
  isOverplay = 0,
  playtime = 0,
  remainSongCnt = 0,
) {

  const params = {
    hash: hash,
    songid: songid,
    mode: mode,
    action: action,
    song_pool_id: songPoolId,
    is_overplay: isOverplay,
    playtime: playtime,
    remain_songcnt: remainSongCnt,
    timestamp: new Date().getTime(),
  }

  return request({
    url: '/personal/fm',
    method: 'get',
    params: params
  });
}

export function fmTrash(id) {
  return request({
    url: '/fm_trash',
    method: 'post',
    params: {
      timestamp: new Date().getTime(),
      id,
    },
  });
}
