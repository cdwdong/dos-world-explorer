import {
  World,
  WorldData,
  WorldEditInput,
  WorldEditOutput,
  EditResult,
  TagStyleInput,
  CheckerWorldEditInput,
  CheckerWorldData,
  TagStyleData,
} from '@src/types';
import { NoDataError } from '../error';

export function testEditSheetToMain(typeId: number) {
  window.electron.ipcRenderer.sendMessage('testEditSheetToMain', [typeId]);
  return new Promise<number>((resolve, reject) => {
    window.electron.ipcRenderer.once(
      'testEditSheetToRenderer',
      (result: unknown) => {
        resolve(result as number);
      },
    );
  });
}

export function getWorldDataToMain() {
  window.electron.ipcRenderer.sendMessage('getWorldDataToMain', []);
  return new Promise<WorldData>((resolve, reject) => {
    window.electron.ipcRenderer.once(
      'getWorldDataToRenderer',
      (result: unknown) => {
        resolve(result as WorldData);
      },
    );
  });
}

export function getCheckerWorldDataToMain() {
  console.log('getCheckerWorldDataToMain test');
  window.electron.ipcRenderer.sendMessage('getCheckerWorldDataToMain', []);
  return new Promise<CheckerWorldData>((resolve, reject) => {
    window.electron.ipcRenderer.once(
      'getCheckerWorldDataToRenderer',
      (result: unknown) => {
        resolve(result as CheckerWorldData);
      },
    );
  });
}

export function getTagStyleDataToMain() {
  console.log('getTagStyleDataToMain test');
  window.electron.ipcRenderer.sendMessage('getTagStyleDataToMain', []);
  return new Promise<TagStyleData>((resolve, reject) => {
    window.electron.ipcRenderer.once(
      'getTagStyleDataToRenderer',
      (result: unknown) => {
        resolve(result as TagStyleData);
      },
    );
  });
}

export function getCanGetSheetAuthToMain(): Promise<boolean> {
  window.electron.ipcRenderer.sendMessage('getCanGetSheetAuthToMain', []);
  return new Promise<boolean>((resolve, reject) => {
    window.electron.ipcRenderer.once(
      'getCanGetSheetAuthToRenderer',
      (result: unknown) => {
        if (result === null) {
          reject(new NoDataError('No Data'));
        }
        resolve(result as boolean);
      },
    );
  });
}

export function addSheetToMain(
  type: 'World' | 'CheckerWorld' | 'TagStyle',
  input: any,
) {
  window.electron.ipcRenderer.sendMessage('addSheetToMain', [type, input]);

  return returnEditResult('addSheetToMain');
}

export function addEditSheetToMain(worldInput: WorldEditInput) {
  window.electron.ipcRenderer.sendMessage('addSheetToMain', [
    'World',
    worldInput,
    'addEditSheetToRenderer',
  ]);

  return returnEditResult('addEditSheetToRenderer');
}

export function addTagStyleSheetToMain(tagStyleInput: TagStyleInput) {
  window.electron.ipcRenderer.sendMessage('addSheetToMain', [
    'TagStyle',
    tagStyleInput,
    'addTagStyleSheetToRenderer',
  ]);

  return returnEditResult('addTagStyleSheetToRenderer');
}

export function addCheckerWorldSheetToMain(
  checkerWorldInput: CheckerWorldEditInput,
) {
  window.electron.ipcRenderer.sendMessage('addSheetToMain', [
    'CheckerWorld',
    checkerWorldInput,
    'addCheckerWorldSheetToRenderer',
  ]);

  return returnEditResult('addCheckerWorldSheetToRenderer');
  // return 'a';
}

export function reomoveEditSheetToMain(key: string) {
  window.electron.ipcRenderer.sendMessage('reomoveSheetToMain', [
    'World',
    key,
    'reomoveEditSheetToRenderer',
  ]);

  return returnEditResult('reomoveEditSheetToRenderer');
}

export function removeCheckerWorldSheetToMain(key: string) {
  window.electron.ipcRenderer.sendMessage('reomoveSheetToMain', [
    'CheckerWorld',
    key,
    'removeCheckerWorldSheetToRenderer',
  ]);

  return returnEditResult('removeCheckerWorldSheetToRenderer');
}

export function removeTagStyleSheetToMain(key: string) {
  window.electron.ipcRenderer.sendMessage('reomoveSheetToMain', [
    'TagStyle',
    key,
    'reomoveTagStyleSheetToRenderer',
  ]);

  return returnEditResult('reomoveTagStyleSheetToRenderer');
}

export function modifyEditSheetToMain(key: string, worldInput: WorldEditInput) {
  window.electron.ipcRenderer.sendMessage('modifySheetToMain', [
    'World',
    key,
    worldInput,
    'modifyEditSheetToRenderer',
  ]);

  return returnEditResult('modifyEditSheetToRenderer');
}

export function modifyTagStyleSheetToMain(
  key: string,
  tagStyle: TagStyleInput,
) {
  window.electron.ipcRenderer.sendMessage('modifySheetToMain', [
    'TagStyle',
    key,
    tagStyle,
    'modifyTagStyleSheetToRenderer',
  ]);

  return returnEditResult('modifyTagStyleSheetToRenderer');
}

export function modifyCheckerWorldSheetToMain(
  key: string,
  checkerWorldInput: CheckerWorldEditInput,
) {
  window.electron.ipcRenderer.sendMessage('modifySheetToMain', [
    'CheckerWorld',
    key,
    checkerWorldInput,
    'modifyCheckerWorldSheetToRenderer',
  ]);

  return returnEditResult('modifyCheckerWorldSheetToRenderer');
}

export function autoFileToMain(worldUrl: string) {
  window.electron.ipcRenderer.sendMessage('autoFileToMain', [worldUrl]);
  return new Promise<WorldEditOutput>((resolve, reject) => {
    window.electron.ipcRenderer.once(
      'autoFileToRenderer',
      (result: unknown) => {
        resolve(result as WorldEditOutput);
      },
    );
  });
}

function returnEditResult(ipcRendererName: string) {
  return new Promise<EditResult>((resolve, reject) => {
    window.electron.ipcRenderer.once(ipcRendererName, (result: unknown) => {
      const er = result as EditResult;
      if (er === EditResult.ALREADYEXIST) {
        reject(new Error('이미 존재합니다.'));
      } else if (er === EditResult.NOTEXIST) {
        reject(new Error('존재하지 않습니다.'));
      } else if (er === EditResult.PROTECTED) {
        reject(new Error('다른곳에서 먼저 사용되고 있습니다.'));
      } else if (er === EditResult.TYPEERROR) {
        reject(new Error('타입이 맞지않습니다'));
      } else if (er === EditResult.UNKNOWN) {
        reject(new Error('알 수 없는 오류 발생'));
      }
      resolve(er);
    });
  });
}
