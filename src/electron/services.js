import clc from 'cli-color';
import checkAuthToken from '../utils/checkAuthToken';
import server from 'kugoumusicapi/server';

export async function startNeteaseMusicApi() {
  // Let user know that the service is starting
  console.log(`${clc.redBright('[NetEase API]')} initiating NCM API`);

  // Load the NCM API.
  await server.startService({
    port: 10700,
    moduleDefs: require('../ncmModDef'),
  });
}
