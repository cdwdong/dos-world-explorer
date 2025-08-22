/* eslint-disable no-await-in-loop */
// /* eslint-disable promise/no-nesting */
import * as vrchat from 'vrchat';
import { v4 } from 'uuid';
import { constants } from 'fs';
import * as fs from 'fs/promises';
import * as path from 'path';
import { app, safeStorage, shell } from 'electron';
import {
  CurrentUser,
  FavoriteGroup,
  FavoriteType,
  LimitedUser,
  LimitedWorld,
  User,
  TwoFactorAuthCode,
  TwoFactorEmailCode,
} from 'vrchat';
import { off } from 'process';
import axios, { AxiosResponse, AxiosRequestConfig } from 'axios';
import { Cookie, CookieJar } from 'tough-cookie';
import { DosFavoriteWorldGroup, LoginResult } from '../../types';
import store from '../store';

const NONCE = v4();
const VRCHATAPIKEY = 'JlE5Jldo5Jibnk5O5hTx6XVqsJu4WJ26';

const axiosConfiguration = axios.create({
  headers: {
    'User-Agent': 'vrce/v0.18.12 cdwdong1@gmail.com',
  },
});
let configuration: vrchat.Configuration;
let authenticationApi = new vrchat.AuthenticationApi(
  undefined,
  undefined,
  axiosConfiguration,
);
const friendsApi = new vrchat.FriendsApi(
  undefined,
  undefined,
  axiosConfiguration,
);
const inviteApi = new vrchat.InviteApi(
  undefined,
  undefined,
  axiosConfiguration,
);
const worldsApi = new vrchat.WorldsApi(
  undefined,
  undefined,
  axiosConfiguration,
);
const usersApi = new vrchat.UsersApi(undefined, undefined, axiosConfiguration);
const favoritesApi = new vrchat.FavoritesApi(
  undefined,
  undefined,
  axiosConfiguration,
);

let user: CurrentUser;

function setAuthCookie(authCookie: string) {
  const axiosDefaults = axios.defaults as any;

  const jar = axiosDefaults.jar as CookieJar;

  jar.setCookie(
    new Cookie({ key: 'auth', value: authCookie }),
    'https://api.vrchat.cloud/',
  );
  jar.setCookie(
    new Cookie({ key: 'apiKey', value: VRCHATAPIKEY }),
    'https://api.vrchat.cloud/',
  );
}

function resetAuthCookie() {
  const axiosDefaults = axios.defaults as any;

  const jar = axiosDefaults.jar as CookieJar;

  jar.removeAllCookiesSync();
}

export async function login(
  id: string,
  pw: string,
  authCookie?: string,
): Promise<LoginResult> {
  if (authCookie) {
    configuration = new vrchat.Configuration({
      apiKey: VRCHATAPIKEY,
    });
    setAuthCookie(authCookie);
  } else {
    configuration = new vrchat.Configuration({
      apiKey: VRCHATAPIKEY,
      username: id,
      password: pw,
      accessToken: authCookie,
    });
  }

  authenticationApi = new vrchat.AuthenticationApi(
    configuration,
    undefined,
    axiosConfiguration,
  );

  return authenticationApi
    .getCurrentUser()
    .then((res) => {
      user = res.data;
      console.log('login success');
      console.log('api displayName :', res.data.displayName);

      if (user.requiresTwoFactorAuth!) {
        throw new Error('Requires Two-Factor Email Authentication');
      }
      return authenticationApi.verifyAuthToken();
    })
    .then((tokenInfo) => {
      store.set('id', safeStorage.encryptString(id));
      store.set('password', safeStorage.encryptString(pw));
      store.set('authCookie', safeStorage.encryptString(tokenInfo.data.token));
      return LoginResult.SUCCESS;
    })
    .catch((err) => {
      if (err.message === 'Requires Two-Factor Email Authentication') {
        console.log('2FA required');
        return LoginResult.TWOFACTOREMAIL;
      }
      if (
        err.response.data.error.message ===
        '"Requires Two-Factor Authentication"'
      ) {
        console.log('2FA required');
        return LoginResult.TWOFACTOR;
      }
      if (
        err.response.data.error.message ===
        '"Invalid Username/Email or Password"'
      ) {
        console.log('Invalid ID or PW');
        return LoginResult.InvalidIDPW;
      }
      console.log('unknown error');
      console.error('login', err.response.data.error);
      return LoginResult.UNKNOWN;
    });
}

export async function autoLogin(): Promise<LoginResult> {
  if (!safeStorage.isEncryptionAvailable()) {
    return LoginResult.NOT_ABLE_ENCRYPTION;
  }
  if (!(store.has('id') && store.has('password') && store.has('authCookie'))) {
    return LoginResult.NO_AUTO_LOGIN_INFO;
  }

  const id = safeStorage.decryptString(Buffer.from(store.get('id') as string));
  const password = safeStorage.decryptString(
    Buffer.from(store.get('password') as string),
  );
  const authCookie = safeStorage.decryptString(
    Buffer.from(store.get('authCookie') as string),
  );

  return login(id, password, authCookie);
}

export async function verify2FACode(code: string): Promise<boolean> {
  const twoFactorAuthCode: TwoFactorAuthCode = {
    code,
  };
  return authenticationApi
    .verify2FA(twoFactorAuthCode)
    .then(async (res) => {
      console.log('2FA verify success');
      return res.data.verified;
    })
    .catch((err) => {
      console.log('verify2FACode error');
      console.log(err.response);
      return false;
    });
}

export async function verify2FAEmailCode(code: string): Promise<boolean> {
  console.log(code);
  const twoFactorAuthCode: TwoFactorEmailCode = {
    code,
  };
  return authenticationApi
    .verify2FAEmailCode(twoFactorAuthCode)
    .then(async (res) => {
      console.log('2FA Email verify success');
      return res.data.verified;
    })
    .catch((err) => {
      console.log('verify2FAEmailCode error');
      console.log(err.response);
      return false;
    });
}

export async function logout(): Promise<boolean> {
  return authenticationApi
    .logout()
    .then(async (res) => {
      user = undefined;
      resetAuthCookie();
      store.reset('id', 'password', 'authCookie');
      console.log('logout success');
      return true;
    })
    .catch((err) => {
      console.warn(err.response.data);
      return false;
    });
}

function authCheck() {
  if (!authenticationApi) {
    console.error('\nError Log: authenticationApi is undefinded');
    return;
  }
  authenticationApi
    .verifyAuthToken()
    .then(async (res) => {
      console.log(res.data);
      if (!res.data.ok) {
        user = (await authenticationApi.getCurrentUser()).data;
      }
    })
    .catch(async (err) => {
      console.log(err.response.data);
      user = (await authenticationApi.getCurrentUser()).data;
    });
}

export async function testVrchatAPI(): Promise<any> {
  return true;
  // return getFriednList();
  // return getFriednList(); // 친구 목록 로딩 TODO 1

  // return generatedWorldInstanceInfo('12345', 'friends', user.data.id, 'jp'); // 인스턴스 생성 TODO 2

  //############################################################################################################################################################

  // const users: User[] = [];
  // users.push({
  //   name: 'test',
  //   id: user.data.id,
  //   currentAvatarThumbnailImageUrl: 'test',
  //   state: UserState.ONLINE,
  // });
  // const instanceId = generatedWorldInstanceInfo(
  //   '12345',
  //   'friends',
  //   user.data.id,
  //   'jp',
  // );
  // sendInvites(users, 'wrld_b02e2bbe-c0c4-46f9-aca2-1d0133eb374f', instanceId); 친구리스트를 받아서 리스트안에 있는 사람들한테 초대 보내기 TODO 3

  //############################################################################################################################################################

  // return genWorldInstanceName('wrld_b02e2bbe-c0c4-46f9-aca2-1d0133eb374f'); // 월드 인스턴스 ID 생성 TODO 4
}

// export async function getFriednList(cnt = 0): Promise<User[]> {
//   await authCheck();
//   const friendsApi = new vrchat.FriendsApi();
//   const friendsData = (await friendsApi.getFriends(cnt)).data;
//   const users: User[] = [];
//   for (let i = 0; i < friendsData.length; i++) {
//     let staus = UserState.OFFLINE;
//     if (friendsData[i].location !== '') {
//       if (friendsData[i].status === 'active') staus = UserState.ONLINE;
//       else if (friendsData[i].status === 'join me') staus = UserState.JOIN_ME;
//       else if (friendsData[i].status === 'ask me') staus = UserState.ASK_ME;
//       else if (friendsData[i].status === 'busy') staus = UserState.BUSY;
//     } else staus = UserState.ACTIVE;

//     const friend: User = {
//       name: friendsData[i].displayName,
//       id: friendsData[i].id,
//       currentAvatarThumbnailImageUrl:
//         friendsData[i].currentAvatarThumbnailImageUrl,
//       state: staus,
//     };
//     if (friendsData[i].userIcon !== '')
//       friend.userIcon = friendsData[i].userIcon;
//     users.push(friend);
//   }
//   if (users.length >= 100) {
//     users.push(...(await getFriednList(cnt + 100)));
//   }
//   return [...new Set(users)];
// }

export async function getFriednList(offline?: boolean): Promise<LimitedUser[]> {
  await authCheck();

  const friends: LimitedUser[] = [];
  let cnt = 0;
  while (true) {
    const res = await friendsApi.getFriends(cnt);
    friends.push(...res.data);
    cnt += 100;
    if (res.data.length < 100) {
      break;
    }
  }
  cnt = 0;
  if (offline === true) {
    while (true) {
      const res = await friendsApi.getFriends(cnt, 100, true);
      friends.push(...res.data);
      cnt += 100;
      if (res.data.length < 100) {
        break;
      }
    }
  }

  return [...new Set(friends)];
}

export async function generatedWorldInstanceInfo(
  instanceName: string,
  instanceType: string,
  region: string,
  ownerId?: string,
): Promise<string> {
  let link = '';
  let userId;
  if (ownerId === undefined) {
    userId = (await authenticationApi.getCurrentUser()).data.id;
  } else {
    userId = ownerId;
  }
  link += instanceName;
  if (instanceType !== 'public') {
    if (instanceType === 'friends+') {
      link += '~hidden(' + userId + ')';
    } else if (instanceType === 'friends') {
      link += '~friends(' + userId + ')';
    } else if (instanceType === 'invite+') {
      link += '~private(' + userId + ')~canRequestInvite';
    } else if (instanceType === 'invite') {
      link += '~private(' + userId + ')';
    }
  }
  link += '~region(' + region + ')';
  if (instanceType !== 'public') {
    link += '~nonce(' + NONCE + ')';
  }
  return link;
}

export async function sendInvites(
  userIds: string[],
  worldId: string,
  instanceId: string,
): Promise<string> {
  await authCheck();

  for (let i = 0; i < userIds.length; i++) {
    inviteApi
      .inviteUser(userIds[i], {
        instanceId: worldId + ':' + instanceId,
      })
      .then((res) => console.log(res.data))
      .catch((err) => console.log(err.response));
  }
  return 'ok!';
}

export async function sendSelfInvite(
  worldId: string,
  instanceId: string,
): Promise<string> {
  await authCheck();

  return inviteApi
    .inviteMyselfTo(worldId, instanceId)
    .then((res) => {
      console.log(res.data);
      return 'ok';
    })
    .catch((err) => {
      console.log(err.response);
      return 'error';
    });
}

export async function genWorldInstanceName(worldId: string): Promise<string> {
  let randInt = Math.floor(Math.random() * 100000)
    .toString()
    .padStart(5, '0');
  // console.log(randInt);
  const worldInstaceInfo = await getWorldInstanceInfo(worldId);
  if (worldInstaceInfo.includes(randInt)) {
    randInt = await genWorldInstanceName(worldId);
  }
  return randInt;
}

export async function getWorldAllInfo(worldId: string) {
  await authCheck();

  const worldData = await worldsApi.getWorld(worldId);
  // console.log(await worldData);
  return worldData.data;
}

export async function getWorldInfo(
  worldId: string,
): Promise<{ name: string; authorName: string; imageUrl: string }> {
  await authCheck();

  const worldData = (await worldsApi.getWorld(worldId)).data;

  return {
    name: worldData.name,
    authorName: worldData.authorName,
    imageUrl: worldData.imageUrl,
  };
}

async function getWorldInstanceInfo(worldId: string): Promise<string[]> {
  await authCheck();

  const worldInstanceInfo = [];
  const worldInstance =
    (await worldsApi.getWorld(worldId)).data.instances || [];
  for (let i = 0; i < worldInstance.length; i++) {
    worldInstanceInfo.push(worldInstance[i][0].split('~')[0]);
  }
  return worldInstanceInfo;
}

export async function getNowinstancePeople() {
  console.log();
}

export async function getVrchatRecentWorlds(
  offset?: number,
  limit?: number,
): Promise<LimitedWorld[]> {
  await authCheck();

  await authenticationApi.getCurrentUser();
  return worldsApi
    .getRecentWorlds(false, 'order', limit, 'descending', offset)
    .then((res) => {
      // const worlds: WorldVrcRaw[] = [];
      // const worldRowdata = res.data;
      // for (let i = 0; i < worldRowdata.length; i++) {
      //   worlds.push({
      //     key: worldRowdata[i].id, // key
      //     name: worldRowdata[i].name, // name
      //     author: worldRowdata[i].authorName, // author
      //     url: 'https://vrchat.com/home/world/' + worldRowdata[i].id, // url
      //     imageUrl: worldRowdata[i].imageUrl, // imageUrl
      //   });
      // }
      // console.log(worlds);
      return res.data;
    });
}

export async function getVrchatlabWorlds(
  offset?: number,
  limit?: number,
): Promise<LimitedWorld[]> {
  await authCheck();

  await authenticationApi.getCurrentUser();
  return worldsApi
    .searchWorlds(
      false,
      'labsPublicationDate',
      undefined,
      undefined,
      limit,
      'descending',
      offset,
    )
    .then((res) => {
      // const worlds: WorldVrcRaw[] = [];
      // const worldRowdata = res.data;
      // for (let i = 0; i < worldRowdata.length; i++) {
      //   worlds.push({
      //     key: worldRowdata[i].id, // key
      //     name: worldRowdata[i].name, // name
      //     author: worldRowdata[i].authorName, // author
      //     url: 'https://vrchat.com/home/world/' + worldRowdata[i].id, // url
      //     imageUrl: worldRowdata[i].imageUrl, // imageUrl
      //   });
      // }
      return res.data;
    });
}

export async function getVrchatNewWorlds(
  offset?: number,
  limit?: number,
): Promise<LimitedWorld[]> {
  await authCheck();

  await authenticationApi.getCurrentUser();
  return worldsApi
    .searchWorlds(
      false,
      'publicationDate',
      undefined,
      undefined,
      limit,
      'descending',
      offset,
    )
    .then((res) => {
      // const worlds: LimitedWorld[] = [];
      // const worldRowdata = res.data;
      // for (let i = 0; i < worldRowdata.length; i++) {
      //   worlds.push({
      //     key: worldRowdata[i].id, // key
      //     name: worldRowdata[i].name, // name
      //     author: worldRowdata[i].authorName, // author
      //     url: 'https://vrchat.com/home/world/' + worldRowdata[i].id, // url
      //     imageUrl: worldRowdata[i].imageUrl, // imageUrl
      //   });
      // }
      return res.data;
    });
}

export async function getCurrentUser(): Promise<CurrentUser> {
  await authCheck();
  return authenticationApi.getCurrentUser().then((res) => {
    return res.data;
  });
}

export async function getUser(userId: string): Promise<User> {
  await authCheck();

  return usersApi.getUser(userId).then((res) => {
    return res.data;
  });
}

export async function getFavoritedWorlds(): Promise<DosFavoriteWorldGroup[]> {
  await authCheck();

  const favoriteGroup: FavoriteGroup[] = [];

  const worlds: LimitedWorld[] = [];
  const dosWorldFavorite: DosFavoriteWorldGroup[] = [];
  let cnt = 0;
  while (true) {
    const res = await favoritesApi.getFavoriteGroups(100, cnt);
    favoriteGroup.push(...res.data);
    cnt += 100;
    if (res.data.length < 100) {
      break;
    }
  }
  cnt = 0;
  while (true) {
    const res = await worldsApi.getFavoritedWorlds(
      true,
      undefined,
      100,
      'descending',
      cnt,
    );
    worlds.push(...res.data);
    cnt += 100;
    if (res.data.length < 100) {
      break;
    }
  }

  // console.log(worlds);

  // console.log(worlds.length);
  for (let i = 0; i < favoriteGroup.length; i++) {
    if (favoriteGroup[i].type === 'world') {
      const tempGroupWorld: LimitedWorld[] = [];
      for (let j = 0; j < worlds.length; j++) {
        if (worlds[j].favoriteGroup === favoriteGroup[i].name) {
          tempGroupWorld.push(worlds[j]);
        }
      }
      dosWorldFavorite.push({
        groupInfo: favoriteGroup[i],
        favorites: tempGroupWorld,
      });
    }
  }
  return dosWorldFavorite;
}

export async function addFavoriteWorld(
  type: string,
  worldId: string,
): Promise<boolean> {
  await authCheck();

  return favoritesApi
    .addFavorite({
      type: FavoriteType.World,
      favoriteId: worldId,
      tags: [type],
    })
    .then((res) => {
      console.log(res);
      return true;
    })
    .catch((err) => {
      console.log(err.response.data);
      return false;
    });
}

export async function removeFavoriteWorld(worldId: string): Promise<boolean> {
  await authCheck();

  let favoriteId = '';
  let cnt = 0;
  while (true) {
    if (
      // eslint-disable-next-line no-await-in-loop
      await worldsApi
        .getFavoritedWorlds(true, undefined, 100, 'descending', cnt)
        // eslint-disable-next-line @typescript-eslint/no-loop-func
        .then((res) => {
          for (let i = 0; i < res.data.length; i++) {
            if (res.data[i].id === worldId) {
              favoriteId = res.data[i].favoriteId;
              return true;
            }
          }
          cnt += 100;
          if (res.data.length < 100) {
            return true;
          }
        })
    ) {
      break;
    }
  }
  if (favoriteId !== '') {
    return favoritesApi
      .removeFavorite(favoriteId)
      .then((res) => {
        console.log(res);
        return true;
      })
      .catch((err) => {
        console.log(err.response.data);
        return false;
      });
  }
  return false;
}
