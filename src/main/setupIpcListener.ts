import { ipcMain, shell } from 'electron';
import {
  testEditSheet,
  getWorldData,
  autoFile,
  addSheet,
  removeSheet,
  modifySheet,
  getCheckerWorldData,
  getTagStyleData,
  getCanGetSheetAuth,
} from './utils/editSheet';
import {
  testVrchatAPI,
  getVrchatRecentWorlds,
  getFriednList,
  generatedWorldInstanceInfo,
  sendInvites,
  genWorldInstanceName,
  login,
  verify2FACode,
  logout,
  sendSelfInvite,
  getCurrentUser,
  getUser,
  getFavoritedWorlds,
  addFavoriteWorld,
  removeFavoriteWorld,
  getVrchatlabWorlds,
  getVrchatNewWorlds,
  getWorldAllInfo,
  verify2FAEmailCode,
  autoLogin,
} from './utils/vrchatAPI';
import {
  showLoadFileDialog,
  loadBookmarks,
  saveBookmarks,
  showSaveFileDialog,
} from './utils/fileSystem';

export default function setupIpcListener() {
  ipcMain.on('ipc-example', async (event, arg) => {
    const msgTemplate = (pingPong: string) => `IPC test: ${pingPong}`;
    console.log(msgTemplate(arg));
    event.reply('ipc-example', msgTemplate('pong'));
  });

  ipcMain.on('open-external-link', async (event, arg) => {
    console.log(`open external link: ${arg}`);
    if (arg.length > 0) {
      shell.openExternal(arg[0]);
    }
  });

  // ###################################### for vrchatAPI.tsx ######################################

  ipcMain.on('testVrchatAPIToMain', async (event, arg) => {
    event.reply('testVrchatAPIToRenderer', await testVrchatAPI());
  });

  ipcMain.on('loginToMain', async (event, arg) => {
    event.reply('loginToRenderer', await login(arg[0], arg[1]));
  });

  ipcMain.on('autoLoginToMain', async (event, arg) => {
    event.reply('autoLoginToRenderer', await autoLogin());
  });

  ipcMain.on('verify2FAcodeToMain', async (event, arg) => {
    event.reply('verify2FAcodeToRenderer', await verify2FACode(arg[0]));
  });

  ipcMain.on('verify2FAEmailcodeToMain', async (event, arg) => {
    event.reply(
      'verify2FAEmailcodeToRenderer',
      await verify2FAEmailCode(arg[0]),
    );
  });

  ipcMain.on('logoutToMain', async (event, arg) => {
    event.reply('logoutToRenderer', await logout());
  });

  ipcMain.on('getFriednListToMain', async (event, arg) => {
    event.reply('getFriednListToRenderer', await getFriednList(arg[0]));
  });

  ipcMain.on('generatedWorldInstanceInfoToMain', async (event, arg) => {
    // testVrchatAPI();
    event.reply(
      'generatedWorldInstanceInfoToRenderer',
      await generatedWorldInstanceInfo(arg[0], arg[1], arg[2], arg[3]),
    );
  });

  ipcMain.on('sendInvitesToMain', async (event, arg) => {
    // testVrchatAPI();
    event.reply(
      'sendInvitesToRenderer',
      await sendInvites(arg[0], arg[1], arg[2]),
    );
  });

  ipcMain.on('sendSelfInviteToMain', async (event, arg) => {
    // testVrchatAPI();
    event.reply(
      'sendSelfInviteToRenderer',
      await sendSelfInvite(arg[0], arg[1]),
    );
  });

  ipcMain.on('genWorldInstanceNameToMain', async (event, arg) => {
    // testVrchatAPI();
    event.reply(
      'genWorldInstanceNameToRenderer',
      await genWorldInstanceName(arg[0]),
    );
  });

  ipcMain.on('getVrchatRencentWorldsToMain', async (event, arg) => {
    event.reply(
      'getVrchatRencentWorldsToRenderer',
      await getVrchatRecentWorlds(arg[0], arg[1]),
    );
  });
  ipcMain.on('getVrchatlabWorldsToMain', async (event, arg) => {
    event.reply(
      'getVrchatlabWorldsToRenderer',
      await getVrchatlabWorlds(arg[0], arg[1]),
    );
  });
  ipcMain.on('getVrchatNewWorldsToMain', async (event, arg) => {
    event.reply(
      'getVrchatNewWorldsToRenderer',
      await getVrchatNewWorlds(arg[0], arg[1]),
    );
  });

  ipcMain.on('getCurrentUserToMain', async (event, arg) => {
    try {
      event.reply('getCurrentUserToRenderer', await getCurrentUser());
    } catch {
      event.reply('getCurrentUserToRenderer', null);
    }
  });

  ipcMain.on('getUserToMain', async (event, arg) => {
    event.reply('getUserToRenderer', await getUser(arg[0]));
  });
  ipcMain.on('getFavoritedWorldsToMain', async (event, arg) => {
    event.reply('getFavoritedWorldsToRenderer', await getFavoritedWorlds());
  });
  ipcMain.on('addFavoriteWorldToMain', async (event, arg) => {
    event.reply(
      'addFavoriteWorldToRenderer',
      await addFavoriteWorld(arg[0], arg[1]),
    );
  });
  ipcMain.on('removeFavoriteWorldToMain', async (event, arg) => {
    event.reply(
      'removeFavoriteWorldToRenderer',
      await removeFavoriteWorld(arg[0]),
    );
  });

  ipcMain.on('getWorldAllInfoToMain', async (event, arg) => {
    event.reply('getWorldAllInfoToRenderer', await getWorldAllInfo(arg[0]));
  });

  // ###################################### for editSheet.tsx ######################################

  ipcMain.on('getCanGetSheetAuthToMain', async (event, arg) => {
    try {
      event.reply('getCanGetSheetAuthToRenderer', await getCanGetSheetAuth());
    } catch {
      event.reply('getCanGetSheetAuthToRenderer', false);
    }
  });

  ipcMain.on('testEditSheetToMain', async (event, arg) => {
    event.reply('testEditSheetToRenderer', await testEditSheet());
  });

  ipcMain.on('getWorldDataToMain', async (event, arg) => {
    event.reply('getWorldDataToRenderer', await getWorldData());
  });

  ipcMain.on('getCheckerWorldDataToMain', async (event, arg) => {
    event.reply('getCheckerWorldDataToRenderer', await getCheckerWorldData());
  });

  ipcMain.on('getTagStyleDataToMain', async (event, arg) => {
    event.reply('getTagStyleDataToRenderer', await getTagStyleData());
  });

  ipcMain.on('addSheetToMain', async (event, arg) => {
    event.reply(arg[2], await addSheet(arg[0], arg[1]));
  });

  ipcMain.on('reomoveSheetToMain', async (event, arg) => {
    event.reply(arg[2], await removeSheet(arg[0], arg[1]));
  });

  ipcMain.on('modifySheetToMain', async (event, arg) => {
    event.reply(arg[3], await modifySheet(arg[0], arg[1], arg[2]));
  });

  ipcMain.on('autoFileToMain', async (event, arg) => {
    event.reply('autoFileToRenderer', await autoFile(arg[0]));
  });

  // ###################################### for bookmarks ######################################

  ipcMain.on('saveBookmarks', async (event, arg) => {
    try {
      event.reply('saveBookmarks', await saveBookmarks(arg[0]));
    } catch {
      event.reply('saveBookmarks', null);
    }
  });
  ipcMain.on('loadBookmarks', async (event, arg) => {
    try {
      event.reply('loadBookmarks', await loadBookmarks());
    } catch {
      event.reply('loadBookmarks', null);
    }
  });
  ipcMain.on('showSaveFileDialog', async (event, arg) => {
    try {
      event.reply('showSaveFileDialog', await showSaveFileDialog(arg[0]));
    } catch {
      event.reply('showSaveFileDialog', null);
    }
  });
  ipcMain.on('showLoadFileDialog', async (event, arg) => {
    try {
      event.reply('showLoadFileDialog', await showLoadFileDialog());
    } catch {
      event.reply('showLoadFileDialog', null);
    }
  });
}
function getCurrentUserWorlds(): any {
  throw new Error('Function not implemented.');
}
function getCheckerWorlddData(): any {
  throw new Error('Function not implemented.');
}
