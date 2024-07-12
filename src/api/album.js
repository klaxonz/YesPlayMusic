import request from '@/utils/request';
import { cacheAlbum, getAlbumFromCache } from '@/utils/db';

/**
 * 获取真实的封面 URL
 * 说明：size 可选参数有 240, 480
 * @param {*} cover
 * @param {number} size
 * @returns
 */
const buildCoverUrl = (cover, size = 480) =>
  cover?.replace('{size}', size) || '';

/**
 * 获取专辑内容
 * 说明 : 调用此接口 , 传入专辑 id, 可获得专辑内容
 * @param {number} id
 */
export async function getAlbum(id) {
  const cachedData = await getAlbumFromCache(id);
  return (
    cachedData ||
    fetchAlbumDetails(id).then(data => {
      cacheAlbum(id, data);
      return data;
    })
  );
}

/**
 * 获取专辑详情
 * @param {number} albumId
 * @returns
 */
async function fetchAlbumDetails(albumId) {
  const albumData = await request({
    url: '/album',
    method: 'get',
    params: { album_id: albumId },
  });

  const songsData = await getAlbumSongs(albumId);

  const album = albumData.data[0];
  albumData.album = {
    name: album.album_name,
    picUrl: buildCoverUrl(album.sizable_cover),
    id: albumId,
    info: album?.intro === 'None' ? album?.intro?.replace('None', '') : '',
    type: 'Album',
    publishTime: album.publish_date,
    company: album.publish_company,
    size: songsData.data.songs.length,
  };

  albumData.songs = songsData.data.songs.map(song => ({
    id: song.base.album_audio_id,
    name: song.base.audio_name,
    hash: song.audio_info.hash,
    al: {
      id: song.base.album_id,
      name: song.album_info.album_name,
      picUrl: buildCoverUrl(song.album_info.cover),
    },
    dt: song.audio_info.duration,
    ar: song.authors.map(ar => ({ id: ar.author_id, name: ar.author_name })),
  }));

  albumData.artist =
    songs.length > 0
      ? { id: songs[0].ar[0].id, name: album.author_name }
      : null;

  return albumData;
}

/**
 * 获取指定专辑的歌曲列表
 *
 * @param {number} id - 专辑ID
 */
export function getAlbumSongs(id) {
  request({
    url: '/album/songs',
    method: 'get',
    params: {
      id,
    },
  });
}

/**
 * 全部新碟
 * 说明 : 登录后调用此接口 ,可获取全部新碟
 * - limit - 返回数量 , 默认为 30
 * - offset - 偏移数量，用于分页 , 如 :( 页数 -1)*30, 其中 30 为 limit 的值 , 默认为 0
 * - area - ALL:全部,ZH:华语,EA:欧美,KR:韩国,JP:日本
 * @param {Object} params
 * @param {number} params.limit
 * @param {number=} params.offset
 * @param {string} params.area
 */
export function newAlbums(params) {
  return request({
    url: '/album/new',
    method: 'get',
    params,
  });
}

/**
 * 专辑动态信息
 * 说明 : 调用此接口 , 传入专辑 id, 可获得专辑动态信息,如是否收藏,收藏数,评论数,分享数
 * - id - 专辑id
 * @param {number} id
 */
export function albumDynamicDetail(id) {
  return request({
    url: '/album/detail/dynamic',
    method: 'get',
    params: { id, timestamp: new Date().getTime() },
  });
}

/**
 * 收藏/取消收藏专辑
 * 说明 : 调用此接口,可收藏/取消收藏专辑
 * - id - 返专辑 id
 * - t - 1 为收藏,其他为取消收藏
 * @param {Object} params
 * @param {number} params.id
 * @param {number} params.t
 */
export function likeAAlbum(params) {
  return request({
    url: '/album/sub',
    method: 'post',
    params,
  });
}
