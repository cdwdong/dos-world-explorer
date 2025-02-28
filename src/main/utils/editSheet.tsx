import { google, sheets_v4 } from 'googleapis';
import axios from 'axios';
import { v4 } from 'uuid';
import { app } from 'electron';
import * as fs from 'node:fs';
import path from 'node:path';
import {
  World,
  WorldData,
  WorldEditInput,
  WorldEditOutput,
  EditResult,
  isWorldEditInput,
  isCheckerWorld,
  isTagStyle,
  isTagStyleInput,
  isCheckerWorldEditInput,
  CheckerWorld,
  CheckerWorldData,
  TagStyle,
  TagStyleData,
} from '../../types';
import { getWorldInfo } from './vrchatAPI';
import { sheetInfos, spreadsheetId, adminEmailList } from './accountStrings';

// console.log('path', path.join(path.dirname(app.getPath('exe'))));
// sheet API 초기화
let client: any;
let keys: any = {};
fs.readFile(
  path.join(path.dirname(app.getPath('exe')), 'sheetAuth.json'),
  'utf8',
  (err, data) => {
    if (err) {
      console.warn('[WARN]', err.name, err.message);
      return;
    }
    keys = JSON.parse(data);

    client = new google.auth.JWT(keys.client_email, '', keys.private_key, [
      'https://www.googleapis.com/auth/drive',
      'https://www.googleapis.com/auth/drive.file',
      'https://www.googleapis.com/auth/spreadsheets',
    ]);
  },
);

export function getSheetAuth() {
  return new Promise((resolve, reject) => {
    fs.readFile(
      path.join(path.dirname(app.getPath('exe')), 'sheetAuth.json'),
      'utf8',
      (err, data) => {
        if (err) {
          console.warn('[WARN]', err.name, err.message);
          reject(err);
        }
        resolve(data);
      },
    );
  });
}

async function transeImageUrl(imageUrl: string): Promise<string> {
  try {
    const html = await axios.get(imageUrl);
    // console.log(html.request.res.responseUrl);
    return html.request.res.responseUrl;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

export async function testEditSheet() {
  // console.log(await getWorldData());
  // try {
  //   const html = await axios.get(
  //     'https://api.vrchat.cloud/api/1/file/file_d277663f-b174-4cd7-aec4-f109608d558e/2/file',
  //   );
  //   console.log(html.request.res.responseUrl);
  // } catch (error) {
  //   console.error(error);
  //   throw error;
  // }
  const protectedRangeId = await protectSheet(sheetInfos.World.sheetId);
  await unprotectSheet(protectedRangeId);
}

export async function autoFile(worldUrl: string): Promise<WorldEditOutput> {
  const regex = /https:\/\/vrchat.com\/home\/world\/([a-zA-Z0-9-_]+)/g;
  const worldUrlMatch = regex.exec(worldUrl);
  if (worldUrlMatch === null) {
    throw new Error('URL이 올바르지 않습니다.');
  }
  const worldId = worldUrlMatch[1];
  const worldData = await getWorldInfo(worldId);
  const nowTime = new Date();
  // console.log(worldId);
  // console.log(worldData.imageUrl);
  // console.log(worldData.name);
  // console.log(worldData.authorName);
  // console.log(nowTime.toISOString().replace('T', ' ').split('.')[0]);
  return {
    key: worldId,
    name: String(worldData.name),
    author: String(worldData.authorName),
    imageUrl: worldData.imageUrl,
    date: nowTime,
  };
}

export async function getWorldData(): Promise<WorldData> {
  const sheets = google.sheets({ version: 'v4', auth: client });
  const authClient = client.authorize();
  //console.log(types);
  const sheetRequest = {
    spreadsheetId: spreadsheetId,
    range: 'sheet1',
    valueRenderOption: 'FORMULA',
    dateTimeRenderOption: 'FORMATTED_STRING',
  };
  const sheetResponse = await sheets.spreadsheets.values.get(sheetRequest);
  const worldData: World[] = [];
  const values = sheetResponse.data.values || [[]];
  values.slice(1).forEach((value) => {
    const world: World = {
      key: value[9], // 월드 고유ID
      name: String(value[1]),
      author: String(value[2]),
      description: String(value[3]),
      tags: value[4].replaceAll(' ', '').substr(1).split('#'),
      score: value[5],
      url: value[6],
      imageUrl: value[0],
      date: new Date(value[8] + 'z'),
      type: value[7],
    };
    // console.log(world);
    worldData.push(world);
  });
  return worldData;
}

export async function getTagStyleData(): Promise<TagStyleData> {
  const sheets = google.sheets({ version: 'v4', auth: client });
  const authClient = client.authorize();
  //console.log(types);
  const sheetRequest = {
    spreadsheetId: spreadsheetId,
    range: 'tagData',
    valueRenderOption: 'FORMULA',
    dateTimeRenderOption: 'FORMATTED_STRING',
  };
  const sheetResponse = await sheets.spreadsheets.values.get(sheetRequest);
  const worldData: TagStyle[] = [];
  const values = sheetResponse.data.values || [[]];
  values.slice(1).forEach((value) => {
    const world: TagStyle = {
      tag: value[0],
      content: value[1].split(','),
      color: value[2],
      key: value[3],
    };
    // console.log(world);
    worldData.push(world);
  });
  return worldData;
}

export async function getCheckerWorldData(): Promise<CheckerWorldData> {
  const sheets = google.sheets({ version: 'v4', auth: client });
  const authClient = client.authorize();
  //console.log(types);
  const sheetRequest = {
    spreadsheetId: spreadsheetId,
    range: 'checker_sheet1',
    valueRenderOption: 'FORMULA',
    dateTimeRenderOption: 'FORMATTED_STRING',
  };
  const sheetResponse = await sheets.spreadsheets.values.get(sheetRequest);
  const checkerWorldData: CheckerWorld[] = [];
  const values = sheetResponse.data.values || [[]];
  // console.log(values[0]);
  values.slice(1).forEach((value) => {
    const checkerWorld: CheckerWorld = {
      key: value[9], // 월드 고유ID
      name: String(value[1]),
      author: String(value[2]),
      description: String(value[3]),
      tags: value[4].replaceAll(' ', '').substr(1).split('#'),
      score: value[5],
      url: value[6],
      imageUrl: value[0],
      date: new Date(value[8] + 'z'),
      checker: value[7],
    };
    // console.log(world);
    checkerWorldData.push(checkerWorld);
  });
  return checkerWorldData;
}

async function protectSheet(sheetID: number): Promise<number> {
  // TODO: Sheet 잠금기능 현재 사용불가
  return 0;
  console.log(sheetID, 'protectSheet!!');
  const sheets = google.sheets({ version: 'v4', auth: client });
  const authClient = client.authorize();
  const request = {
    spreadsheetId: spreadsheetId,
    resource: {
      requests: [
        {
          addProtectedRange: {
            protectedRange: {
              range: {
                sheetId: sheetID,
              },
              editors: {
                users: [adminEmailList],
              },
            },
          },
        },
      ],
    },
  };
  try {
    const response: any = (await sheets.spreadsheets.batchUpdate(request)).data;
    // TODO: Change code below to process the `response` object:
    //console.log(JSON.stringify(response, null, 2));
    // console.log(
    //   response.replies[0].addProtectedRange?.protectedRange?.protectedRangeId,
    // );
    return response.replies[0].addProtectedRange?.protectedRange
      ?.protectedRangeId;
    //console.log(response);
  } catch (err: any) {
    console.error(err);
    //console.log(err.response.data);
    return -1;
  }
}

async function unprotectSheet(protectedRangeId: number) {
  // TODO: Sheet 잠금기능 현재 사용불가
  return 0;
  console.log('unprotectSheet!!');
  const sheets = google.sheets({ version: 'v4', auth: client });
  const authClient = client.authorize();
  const request = {
    spreadsheetId: spreadsheetId,
    resource: {
      requests: [
        {
          deleteProtectedRange: {
            protectedRangeId: protectedRangeId,
          },
        },
      ],
    },
  };
  try {
    const response: any = (await sheets.spreadsheets.batchUpdate(request)).data;
    // TODO: Change code below to process the `response` object:
    //console.log(JSON.stringify(response, null, 2));
    // console.log(
    //   response.replies[0].addProtectedRange?.protectedRange?.protectedRangeId,
    // );
    //console.log(response);
  } catch (err: any) {
    //console.error(err);
    //console.log(err.response.data);
  }
  return 0;
}

function overLapCheck(worldData: WorldData, key: string) {
  for (let i = 0; i < worldData.length; i++) {
    if (key === worldData[i].key) {
      return true;
    }
  }
  return false;
}

function sheetExistCheck(data: any[][], key: string): number {
  const keyIndex: number = data[0].indexOf('key');
  for (let i = 1; i < data.length; i++) {
    if (key === data[i][keyIndex]) {
      return i;
    }
  }
  return -1;
}

export async function getSheet(sheets: sheets_v4.Sheets, sheetname: string) {
  // const sheets = google.sheets({ version: 'v4', auth: client });
  // client.authorize();
  const sheetRequest = {
    spreadsheetId: spreadsheetId,
    range: sheetname,
    valueRenderOption: 'FORMULA',
    dateTimeRenderOption: 'FORMATTED_STRING',
  };
  // 추가할 항목의 중복 확인
  return (
    (await sheets.spreadsheets.values.get(sheetRequest)).data.values || [[]]
  );
}

export async function addSheet(
  type: 'World' | 'CheckerWorld' | 'TagStyle',
  input: any,
): Promise<EditResult> {
  const sheets = google.sheets({ version: 'v4', auth: client });
  const authClient = client.authorize();

  // 다른사람이 수정중인지확인
  const protectedRangeId = await protectSheet(sheetInfos[type].sheetId);
  if (protectedRangeId < 0) {
    console.log('시트 수정중');
    return EditResult.PROTECTED;
  }

  // 추가할 항목의 중복검사를 위한 시트 요청생성
  // const sheetRequest = {
  //   spreadsheetId: spreadsheetId,
  //   range: sheetInfos[type].sheetName,
  //   valueRenderOption: 'FORMULA',
  //   dateTimeRenderOption: 'FORMATTED_STRING',
  // };
  // 추가할 항목의 중복 확인
  // const sheetResponse = await sheets.spreadsheets.values.get(sheetRequest);
  const values = await getSheet(sheets, sheetInfos[type].sheetName);
  // console.log(values);
  let sheetInput: any[] = [];
  if (type === 'World') {
    if (isWorldEditInput(input)) {
      const worldOutput = await autoFile(input.url);
      const index = sheetExistCheck(values, worldOutput.key);
      if (index < 0) {
        sheetInput = [
          worldOutput.imageUrl,
          worldOutput.name,
          worldOutput.author,
          input.description,
          '#' + input.tags.join(' #'),
          input.score,
          input.url,
          input.type,
          worldOutput.date.toISOString().replace('T', ' ').split('.')[0],
          worldOutput.key,
        ];
      } else {
        await unprotectSheet(protectedRangeId);
        return EditResult.ALREADYEXIST;
      }
    } else {
      await unprotectSheet(protectedRangeId);
      return EditResult.TYPEERROR;
    }
  } else if (type === 'CheckerWorld') {
    if (isCheckerWorldEditInput(input)) {
      const worldOutput = await autoFile(input.url);
      const index = sheetExistCheck(
        values,
        'cwrld_' +
          input.checker.split('_')[1] +
          '_' +
          worldOutput.key.split('_')[1],
      );
      if (index < 0) {
        sheetInput = [
          worldOutput.imageUrl,
          worldOutput.name,
          worldOutput.author,
          input.description,
          '#' + input.tags.join(' #'),
          input.score,
          input.url,
          input.checker,
          worldOutput.date.toISOString().replace('T', ' ').split('.')[0],
          'cwrld_' +
            input.checker.split('_')[1] +
            '_' +
            worldOutput.key.split('_')[1],
        ];
      } else {
        await unprotectSheet(protectedRangeId);
        return EditResult.ALREADYEXIST;
      }
    } else {
      await unprotectSheet(protectedRangeId);
      return EditResult.TYPEERROR;
    }
  } else if (type === 'TagStyle') {
    if (isTagStyleInput(input)) {
      console.log('test!!!');
      let key = '';
      while (true) {
        key = 'tagid_' + v4();
        if (sheetExistCheck(values, key) < 0) break;
      }
      sheetInput = [input.tag, input.content.join(','), input.color, key];
    } else {
      console.log('test2!!!');
      await unprotectSheet(protectedRangeId);
      return EditResult.TYPEERROR;
    }
  } else {
    return EditResult.TYPEERROR;
  }

  const addrequest = {
    spreadsheetId: spreadsheetId,
    range: sheetInfos[type].sheetName,
    valueInputOption: 'USER_ENTERED',
    resource: {
      values: [sheetInput],
    },
  };
  await sheets.spreadsheets.values.append(addrequest);
  await unprotectSheet(protectedRangeId);
  return EditResult.SUCCESS;
}

export async function removeSheet(
  type: 'World' | 'CheckerWorld' | 'TagStyle',
  key: string,
): Promise<EditResult> {
  const sheets = google.sheets({ version: 'v4', auth: client });
  const authClient = client.authorize();

  // 다른사람이 수정중인지확인
  const protectedRangeId = await protectSheet(sheetInfos[type].sheetId);
  if (protectedRangeId < 0) {
    console.log('시트 수정중');
    return EditResult.PROTECTED;
  }

  // // 삭제할 항목의 위치를 얻기위한 시트 요청생성
  // const sheetRequest = {
  //   spreadsheetId: spreadsheetId,
  //   range: sheetInfos[type].sheetName,
  //   valueRenderOption: 'FORMULA',
  //   dateTimeRenderOption: 'FORMATTED_STRING',
  // };

  // // 시트 요청및 삭제할 항목의 위치를 검색
  // const sheetResponse = await sheets.spreadsheets.values.get(sheetRequest);
  // const values =
  const values = await getSheet(sheets, sheetInfos[type].sheetName);
  const index = sheetExistCheck(values, key);

  try {
    if (index !== -1) {
      const request = {
        spreadsheetId: spreadsheetId,
        resource: {
          requests: [
            {
              deleteDimension: {
                range: {
                  dimension: 'ROWS',
                  sheetId: sheetInfos[type].sheetId,
                  startIndex: index,
                  endIndex: index + 1,
                },
              },
            },
          ],
        },
      };
      await sheets.spreadsheets.batchUpdate(request);
      await unprotectSheet(protectedRangeId);
      return EditResult.SUCCESS;
    }
    await unprotectSheet(protectedRangeId);
    return EditResult.NOTEXIST;
  } catch (e) {
    await unprotectSheet(protectedRangeId);
    console.log(e);
    return EditResult.UNKNOWN;
  }
}

export async function modifySheet(
  type: 'World' | 'CheckerWorld' | 'TagStyle',
  key: string,
  input: any,
): Promise<EditResult> {
  const sheets = google.sheets({ version: 'v4', auth: client });
  const authClient = client.authorize();

  // 다른사람이 수정중인지확인
  const protectedRangeId = await protectSheet(sheetInfos[type].sheetId);
  if (protectedRangeId < 0) {
    console.log('시트 수정중');
    return EditResult.PROTECTED;
  }
  // 수정 항목의 위치를 얻기위한 시트 요청생성
  // const sheetRequest = {
  //   spreadsheetId: spreadsheetId,
  //   range: sheetInfos[type].sheetName,
  //   valueRenderOption: 'FORMULA',
  //   dateTimeRenderOption: 'FORMATTED_STRING',
  // };

  // // 시트에서 수정할 항목의 위치를 검색
  // const sheetResponse = await sheets.spreadsheets.values.get(sheetRequest);
  // const values =
  const values = await getSheet(sheets, sheetInfos[type].sheetName);
  const index = sheetExistCheck(values, key);

  try {
    if (index !== -1) {
      let sheetInput: any[] = [];
      let sheetRange = '';

      // 수정내용 가공 및 수정 범위설정
      if (type === 'World') {
        sheetInput = [
          input.description,
          '#' + input.tags.join(' #'),
          input.score,
          input.url,
          input.type,
        ];
        sheetRange = '!D' + (index + 1) + ':H' + (index + 1);
      } else if (type === 'TagStyle') {
        sheetInput = [input.tag, input.content.join(','), input.color];
        sheetRange = '!A' + (index + 1) + ':C' + (index + 1);
      } else if (type === 'CheckerWorld') {
        sheetInput = [
          input.description,
          '#' + input.tags.join(' #'),
          input.score,
        ];
        sheetRange = '!D' + (index + 1) + ':F' + (index + 1);
      } else {
        await unprotectSheet(protectedRangeId);
        return EditResult.TYPEERROR;
      }

      // 수정할 시트에 대한 요청 생성
      const request = {
        spreadsheetId: spreadsheetId,
        range: sheetInfos[type].sheetName + sheetRange,
        valueInputOption: 'USER_ENTERED',
        resource: {
          values: [sheetInput],
        },
      };

      // 요청보내기
      await sheets.spreadsheets.values.update(request);
      console.log('success');
      await unprotectSheet(protectedRangeId);
      return EditResult.SUCCESS;
    }
    await unprotectSheet(protectedRangeId);
    //console.log(world);
    return EditResult.NOTEXIST;
  } catch (e) {
    await unprotectSheet(protectedRangeId);
    console.log(e);
    return EditResult.UNKNOWN;
  }
}

// export async function modifyEditSheet(
//   key: string,
//   worldInput: WorldEditInput,
// ): Promise<EditResult> {
//   const sheets = google.sheets({ version: 'v4', auth: client });
//   const authClient = client.authorize();
//   const protectedRangeId = await protectSheet(sheetId);
//   if (protectedRangeId < 0) {
//     console.log('시트 수정중');
//     return EditResult.PROTECTED;
//   }
//   const worldData = await getWorldData();
//   let index = -1;
//   for (let i = 0; i < worldData.length; i++) {
//     if (key === worldData[i].key) {
//       index = i;
//       break;
//     }
//   }

//   try {
//     if (index !== -1) {
//       const values = [
//         [
//           worldInput.description,
//           '#' + worldInput.tags.join(' #'),
//           worldInput.score,
//           worldInput.url,
//           worldInput.type,
//         ],
//       ];

//       const request = {
//         spreadsheetId: spreadsheetId,
//         range: sheetName + '!D' + (index + 2) + ':H' + (index + 2),
//         valueInputOption: 'USER_ENTERED',
//         resource: {
//           values: values,
//         },
//       };
//       await sheets.spreadsheets.values.update(request);
//       await unprotectSheet(protectedRangeId);
//       return EditResult.SUCCESS;
//     }
//     await unprotectSheet(protectedRangeId);
//     //console.log(world);
//     return EditResult.NOTEXIST;
//   } catch (e) {
//     await unprotectSheet(protectedRangeId);
//     console.log(e);
//     return EditResult.UNKNOWN;
//   }
// }

// export async function addEditSheet(
//   worldInput: WorldEditInput,
// ): Promise<EditResult> {
//   const sheets = google.sheets({ version: 'v4', auth: client });
//   const authClient = client.authorize();
//   const protectedRangeId = await protectSheet(sheetId);
//   if (protectedRangeId < 0) {
//     console.log('시트 수정중');
//     return EditResult.PROTECTED;
//   }
//   const worldData = await getWorldData();
//   const worldOutput = await autoFile(worldInput.url);
//   if (overLapCheck(worldData, worldOutput.key)) {
//     await unprotectSheet(protectedRangeId);
//     return EditResult.ALREADYEXIST;
//   }
//   try {
//     const values = [
//       [
//         '=Image("' + worldOutput.imageUrl + '",2)',
//         worldOutput.name,
//         worldOutput.author,
//         worldInput.description,
//         '#' + worldInput.tags.join(' #'),
//         '★'.repeat(worldInput.score),
//         worldInput.url,
//         worldInput.type,
//         worldOutput.date.toISOString().replace('T', ' ').split('.')[0],
//         worldOutput.key,
//       ],
//     ];
//     console.log('test');
//     const addrequest = {
//       spreadsheetId: spreadsheetId,
//       range: sheetName,
//       valueInputOption: 'USER_ENTERED',
//       resource: {
//         values: values,
//       },
//     };
//     await sheets.spreadsheets.values.append(addrequest);
//     await unprotectSheet(protectedRangeId);
//     return EditResult.SUCCESS;
//   } catch (e) {
//     console.log(e);
//     await unprotectSheet(protectedRangeId);
//     return EditResult.UNKNOWN;
//   }
// }

// export async function removeEditSheet(key: string): Promise<EditResult> {
//   const sheets = google.sheets({ version: 'v4', auth: client });
//   const authClient = client.authorize();
//   const protectedRangeId = await protectSheet(sheetId);
//   if (protectedRangeId < 0) {
//     console.log('시트 수정중');
//     return EditResult.PROTECTED;
//   }
//   const worldData = await getWorldData();
//   let index = -1;
//   for (let i = 0; i < worldData.length; i++) {
//     if (key === worldData[i].key) {
//       index = i;
//       break;
//     }
//   }

//   try {
//     if (index !== -1) {
//       const request = {
//         spreadsheetId: spreadsheetId,
//         resource: {
//           requests: [
//             {
//               deleteDimension: {
//                 range: {
//                   dimension: 'ROWS',
//                   sheetId: sheetId,
//                   startIndex: index + 1,
//                   endIndex: index + 2,
//                 },
//               },
//             },
//           ],
//         },
//       };
//       await sheets.spreadsheets.batchUpdate(request);
//       await unprotectSheet(protectedRangeId);
//       return EditResult.SUCCESS;
//     }
//     await unprotectSheet(protectedRangeId);
//     return EditResult.NOTEXIST;
//   } catch (e) {
//     await unprotectSheet(protectedRangeId);
//     console.log(e);
//     return EditResult.UNKNOWN;
//   }
// }
