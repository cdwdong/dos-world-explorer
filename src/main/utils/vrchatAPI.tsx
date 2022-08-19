// /* eslint-disable promise/no-nesting */
import * as vrchat from 'vrchat';
import { v4 } from 'uuid';
import { constants } from 'fs';
import * as fs from 'fs/promises';
import * as path from 'path';
import { app, shell } from 'electron';
import { CurrentUser, LimitedUser, User } from 'vrchat';
import { off } from 'process';
import { WorldVrcRaw } from '../../types';

const NONCE = v4();
const VRCHATAPIKEY = 'JlE5Jldo5Jibnk5O5hTx6XVqsJu4WJ26';

let authenticationApi = new vrchat.AuthenticationApi();

let user;

export async function login(id: string, pw: string): Promise<boolean> {
  authenticationApi = new vrchat.AuthenticationApi(
    new vrchat.Configuration({
      apiKey: VRCHATAPIKEY,
      username: id,
      password: pw,
    }),
  );

  return authenticationApi
    .getCurrentUser()
    .then(async (res) => {
      user = res.data;
      // console.log(user);
      console.log('login success');
      console.log('api displayName :', res.data.displayName);
      return true;
    })
    .catch((err) => {
      console.log(err.response.data);
      return false;
    });
}

export async function logout(): Promise<boolean> {
  return authenticationApi
    .logout()
    .then(async (res) => {
      user = res.data;
      // console.log(user);
      console.log('logout success');
      return true;
    })
    .catch((err) => {
      console.warn(err.response.data);
      return false;
    });
}

function authCheck() {
  authenticationApi = new vrchat.AuthenticationApi();
  authenticationApi
    .verifyAuthToken()
    .then(async (res) => {
      console.log(res.data);
      if (!res.data.ok) {
        authenticationApi = new vrchat.AuthenticationApi();
        user = await authenticationApi.getCurrentUser();
      }
    })
    .catch(async (err) => {
      console.log(err.response.data);
      authenticationApi = new vrchat.AuthenticationApi();
      user = await authenticationApi.getCurrentUser();
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
  const friendsApi = new vrchat.FriendsApi();
  const friends: LimitedUser[] = [];
  let cnt = 0;
  while (true) {
    if (
      // eslint-disable-next-line no-await-in-loop, @typescript-eslint/no-loop-func
      await friendsApi.getFriends(cnt).then((res) => {
        friends.push(...res.data);
        cnt += 100;
        if (res.data.length < 100) {
          return true;
        }
      })
    ) {
      break;
    }
  }
  cnt = 0;
  if (offline === true) {
    while (true) {
      if (
        // eslint-disable-next-line no-await-in-loop, @typescript-eslint/no-loop-func
        await friendsApi.getFriends(cnt, 100, true).then((res) => {
          friends.push(...res.data);
          cnt += 100;
          if (res.data.length < 100) {
            return true;
          }
        })
      ) {
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
  const inviteApi = new vrchat.InviteApi();
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
  const instancesApi = new vrchat.InstancesApi();
  return instancesApi
    .sendSelfInvite(worldId, instanceId)
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
  console.log(randInt);
  const worldInstaceInfo = await getWorldInstanceInfo(worldId);
  if (worldInstaceInfo.includes(randInt)) {
    randInt = await genWorldInstanceName(worldId);
  }
  return randInt;
}

export async function getWorldInfo(
  worldId: string,
): Promise<{ name: string; authorName: string; thumbnailImageUrl: string }> {
  await authCheck();
  const WorldsApi = new vrchat.WorldsApi();
  const worldData = (await WorldsApi.getWorld(worldId)).data;

  return {
    name: worldData.name,
    authorName: worldData.authorName,
    thumbnailImageUrl: worldData.thumbnailImageUrl,
  };
}

async function getWorldInstanceInfo(worldId: string): Promise<string[]> {
  await authCheck();
  const worldsApi = new vrchat.WorldsApi();
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

export async function getVrchatRecentWorlds(): Promise<WorldVrcRaw[]> {
  await authCheck();
  const WorldsApi = new vrchat.WorldsApi();
  await authenticationApi.getCurrentUser();
  return WorldsApi.getRecentWorlds().then((res) => {
    const worlds: WorldVrcRaw[] = [];
    const worldRowdata = res.data;
    for (let i = 0; i < worldRowdata.length; i++) {
      worlds.push({
        key: worldRowdata[i].id, // key
        name: worldRowdata[i].name, // name
        author: worldRowdata[i].authorName, // author
        url: 'https://vrchat.com/home/world/' + worldRowdata[i].id, // url
        imageUrl: worldRowdata[i].imageUrl, // imageUrl
      });
    }
    return worlds;
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
  const usersApi = new vrchat.UsersApi();
  return usersApi.getUser(userId).then((res) => {
    return res.data;
  });
}
