import { Bookmarks } from '@src/types';
import { app, dialog, shell } from 'electron';
import { constants } from 'fs';
import * as fs from 'fs/promises';
import * as path from 'path';

const FAV_PATH = path.join(
  app.getPath('documents'),
  app.getName(),
  'favorites.json',
);

export function saveBookmarks(bookmarks: Bookmarks) {
  return fs
    .access(FAV_PATH, constants.R_OK)
    .catch(() => fs.mkdir(path.dirname(FAV_PATH), { recursive: true }))
    .then(() => fs.writeFile(FAV_PATH, JSON.stringify(bookmarks)))
    .then(() => bookmarks);
}

export function loadBookmarks(): Promise<Bookmarks> {
  return fs.readFile(FAV_PATH).then((v: Buffer) => JSON.parse(v.toString()));
}

export async function showSaveFileDialog(file: unknown) {
  const dialogResult = await dialog.showSaveDialog({
    title: '파일의 저장 경로를 선택해주세요.',
    defaultPath: app.getPath('documents'),
    filters: [
      {
        name: 'files',
        extensions: ['json'],
      },
    ],
  });
  if (dialogResult.canceled) {
    throw new Error('Canceled');
  }

  const targetDirectory = dialogResult.filePath as string;
  return fs
    .access(targetDirectory, constants.R_OK)
    .catch(() => fs.mkdir(path.dirname(targetDirectory), { recursive: true }))
    .then(() => fs.writeFile(targetDirectory, JSON.stringify(file, null, 2)))
    .then(() => file);
}

export async function showLoadFileDialog(): Promise<unknown> {
  const dialogResult = await dialog.showOpenDialog({
    title: '불러올 파일을 선택해주세요.',
    defaultPath: app.getPath('documents'),
    properties: ['openFile'],
    filters: [
      {
        name: 'files',
        extensions: ['json'],
      },
    ],
  });
  if (dialogResult.canceled) {
    throw new Error('Canceled');
  }

  const filePath = dialogResult.filePaths[0];
  return fs.readFile(filePath).then((v: Buffer) => JSON.parse(v.toString()));
}
