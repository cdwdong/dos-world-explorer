import { DosFavoriteWorldGroup, LoginResult } from '@src/types';
import { rejects } from 'assert';
import { CurrentUser, LimitedWorld, User, World } from 'vrchat';

export function testVrchatAPIToMain() {
  window.electron.ipcRenderer.sendMessage('testVrchatAPIToMain', []);
  return new Promise<any>((resolve, reject) => {
    window.electron.ipcRenderer.once(
      'testVrchatAPIToRenderer',
      (result: unknown) => {
        resolve(result as any);
      },
    );
  });
}

export function loginToMain(id: string, pw: string) {
  window.electron.ipcRenderer.sendMessage('loginToMain', [id, pw]);
  return new Promise<LoginResult>((resolve, reject) => {
    window.electron.ipcRenderer.once('loginToRenderer', (result: unknown) => {
      const res = result as LoginResult;
      if (res === LoginResult.SUCCESS) {
        resolve(res);
      } else {
        reject(res);
      }
    });
  });
}

export function autoLoginToMain() {
  window.electron.ipcRenderer.sendMessage('autoLoginToMain', []);
  return new Promise<LoginResult>((resolve, reject) => {
    window.electron.ipcRenderer.once('autoLoginToRenderer', (result) => {
      const res = result as LoginResult;
      if (res === LoginResult.SUCCESS) {
        resolve(res);
      } else {
        reject(res);
      }
    });
  });
}

export function verify2FAcodeToMain(code: string) {
  window.electron.ipcRenderer.sendMessage('verify2FAcodeToMain', [code]);
  return new Promise<boolean>((resolve, reject) => {
    window.electron.ipcRenderer.once(
      'verify2FAcodeToRenderer',
      (result: unknown) => {
        const res = result as boolean;
        if (res === true) {
          resolve(res);
        } else {
          reject(res);
        }
      },
    );
  });
}

export function verify2FAEmailCodeToMain(code: string) {
  window.electron.ipcRenderer.sendMessage('verify2FAEmailcodeToMain', [code]);
  return new Promise<boolean>((resolve, reject) => {
    window.electron.ipcRenderer.once(
      'verify2FAEmailcodeToRenderer',
      (result: unknown) => {
        const res = result as boolean;
        if (res === true) {
          resolve(res);
        } else {
          reject(res);
        }
      },
    );
  });
}

export function logoutToMain() {
  window.electron.ipcRenderer.sendMessage('logoutToMain', []);
  return new Promise<void>((resolve, reject) => {
    window.electron.ipcRenderer.once('logoutToRenderer', (result: unknown) => {
      if (result) {
        resolve();
      }
      reject();
    });
  });
}

export function getFriednListToMain(offline?: boolean) {
  window.electron.ipcRenderer.sendMessage('getFriednListToMain', [offline]);
  return new Promise<User[]>((resolve, reject) => {
    window.electron.ipcRenderer.once(
      'getFriednListToRenderer',
      (result: unknown) => {
        resolve(result as User[]);
      },
    );
  });
}

export function generatedWorldInstanceInfoToMain(
  instanceName: string,
  instanceType: string,
  region: string,
  ownerId?: string,
) {
  window.electron.ipcRenderer.sendMessage('generatedWorldInstanceInfoToMain', [
    instanceName,
    instanceType,
    region,
    ownerId,
  ]);
  return new Promise<string>((resolve, reject) => {
    window.electron.ipcRenderer.once(
      'generatedWorldInstanceInfoToRenderer',
      (result: unknown) => {
        resolve(result as string);
      },
    );
  });
}

export function sendInvitesToMain(
  userKeyList: string[],
  worldId: string,
  instanceId: string,
) {
  window.electron.ipcRenderer.sendMessage('sendInvitesToMain', [
    userKeyList,
    worldId,
    instanceId,
  ]);
  return new Promise<string>((resolve, reject) => {
    window.electron.ipcRenderer.once(
      'sendInvitesToRenderer',
      (result: unknown) => {
        resolve(result as string);
      },
    );
  });
}

export function sendSelfInviteToMain(worldId: string, instanceId: string) {
  window.electron.ipcRenderer.sendMessage('sendSelfInviteToMain', [
    worldId,
    instanceId,
  ]);
  return new Promise<string>((resolve, reject) => {
    window.electron.ipcRenderer.once(
      'sendSelfInviteToRenderer',
      (result: unknown) => {
        if (result === 'ok') {
          resolve(result as string);
        } else {
          reject(result);
        }
      },
    );
  });
}

export function genWorldInstanceNameToMain(worldId: string) {
  window.electron.ipcRenderer.sendMessage('genWorldInstanceNameToMain', [
    worldId,
  ]);
  return new Promise<string>((resolve, reject) => {
    window.electron.ipcRenderer.once(
      'genWorldInstanceNameToRenderer',
      (result: unknown) => {
        resolve(result as string);
      },
    );
  });
}

export function getVrchatRecentWorldsToMain(offset?: number, limit?: number) {
  window.electron.ipcRenderer.sendMessage('getVrchatRencentWorldsToMain', [
    offset,
    limit,
  ]);
  return new Promise<LimitedWorld[]>((resolve, reject) => {
    window.electron.ipcRenderer.once(
      'getVrchatRencentWorldsToRenderer',
      (result: unknown) => {
        resolve(result as LimitedWorld[]);
      },
    );
  });
}

export function getVrchatlabWorldsToMain(offset?: number, limit?: number) {
  window.electron.ipcRenderer.sendMessage('getVrchatlabWorldsToMain', [
    offset,
    limit,
  ]);
  return new Promise<LimitedWorld[]>((resolve, reject) => {
    window.electron.ipcRenderer.once(
      'getVrchatlabWorldsToRenderer',
      (result: unknown) => {
        resolve(result as LimitedWorld[]);
      },
    );
  });
}

export function getVrchatNewWorldsToMain(offset?: number, limit?: number) {
  window.electron.ipcRenderer.sendMessage('getVrchatNewWorldsToMain', [
    offset,
    limit,
  ]);
  return new Promise<LimitedWorld[]>((resolve, reject) => {
    window.electron.ipcRenderer.once(
      'getVrchatNewWorldsToRenderer',
      (result: unknown) => {
        resolve(result as LimitedWorld[]);
      },
    );
  });
}

export function getCurrentUserToMain() {
  window.electron.ipcRenderer.sendMessage('getCurrentUserToMain', []);
  return new Promise<CurrentUser>((resolve, reject) => {
    window.electron.ipcRenderer.once(
      'getCurrentUserToRenderer',
      (result: unknown) => {
        if (result === null) {
          reject();
        }
        resolve(result as CurrentUser);
      },
    );
  });
}

export function getUserToMain(userId: string) {
  window.electron.ipcRenderer.sendMessage('getUserToMain', [userId]);
  return new Promise<User>((resolve, reject) => {
    window.electron.ipcRenderer.once('getUserToRenderer', (result: unknown) => {
      resolve(result as User);
    });
  });
}

export function getFavoritedWorldsToMain() {
  window.electron.ipcRenderer.sendMessage('getFavoritedWorldsToMain', []);
  return new Promise<DosFavoriteWorldGroup[]>((resolve, reject) => {
    window.electron.ipcRenderer.once(
      'getFavoritedWorldsToRenderer',
      (result: unknown) => {
        resolve(result as DosFavoriteWorldGroup[]);
      },
    );
  });
}

export function addFavoriteWorldToMain(type: string, worldId: string) {
  window.electron.ipcRenderer.sendMessage('addFavoriteWorldToMain', [
    type,
    worldId,
  ]);
  return new Promise<boolean>((resolve, reject) => {
    window.electron.ipcRenderer.once(
      'addFavoriteWorldToRenderer',
      (result: unknown) => {
        resolve(result as boolean);
      },
    );
  });
}

export function removeFavoriteWorldToMain(worldId: string) {
  window.electron.ipcRenderer.sendMessage('removeFavoriteWorldToMain', [
    worldId,
  ]);
  return new Promise<boolean>((resolve, reject) => {
    window.electron.ipcRenderer.once(
      'removeFavoriteWorldToRenderer',
      (result: unknown) => {
        resolve(result as boolean);
      },
    );
  });
}

export function getWorldAllInfoToMain(worldId: string) {
  window.electron.ipcRenderer.sendMessage('getWorldAllInfoToMain', [worldId]);
  return new Promise<World>((resolve, reject) => {
    window.electron.ipcRenderer.once(
      'getWorldAllInfoToRenderer',
      (result: unknown) => {
        resolve(result as World);
      },
    );
  });
}
