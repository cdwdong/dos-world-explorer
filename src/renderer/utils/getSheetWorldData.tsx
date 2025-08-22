/* eslint-disable @typescript-eslint/naming-convention */
import axios from 'axios';
import { World, WorldData, TagStyle } from '@src/types';
import { NoDataError } from './error';

const sheetUrl =
  'https://docs.google.com/spreadsheets/d/e/2PACX-1vTIfeYsn61kyygaoO8a6FBChhhWvq2E2wwUiUR83OfxdElXoEz7lc2q79lBrDxHAxrhEry2gd20zL7i/pubhtml?gid=2042658372&single=true';
const sheetTagUrl =
  'https://docs.google.com/spreadsheets/d/e/2PACX-1vTIfeYsn61kyygaoO8a6FBChhhWvq2E2wwUiUR83OfxdElXoEz7lc2q79lBrDxHAxrhEry2gd20zL7i/pubhtml?gid=189423536&single=true';

const domparser = new DOMParser();
// eslint-disable-next-line consistent-return
export const getHtml = async (url: string) => {
  // console.log(sheetUrl + '?_=' + new Date().getTime());
  try {
    const html = await axios.get(url + '&_=' + new Date().getTime(), {
      headers: {
        'Cache-Control': 'no-cache',
      },
    });
    return html;
  } catch (error) {
    console.error(error);
    throw error;
  }
};
export const getHtmlTagStyle = async () => {
  // console.log(sheetUrl + '?_=' + new Date().getTime());
  try {
    const html = await axios.get(sheetUrl + '&_=' + new Date().getTime(), {
      headers: {
        'Cache-Control': 'no-cache',
      },
    });
    return html;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

export async function test() {
  try {
    const html = await axios.get(sheetUrl + '?_=' + new Date().getTime());
    console.log(html.data);
  } catch (error) {
    console.error(error);
    throw error;
  }
}

export default function getSheetWorldData(privateVisible = false) {
  const worldData: WorldData = [];
  return getHtml(sheetUrl)
    .then((html) => {
      if (!html) throw new NoDataError();

      const doc = domparser.parseFromString(html.data, 'text/html');

      const raws = doc
        .getElementsByTagName('tbody')[0]
        .getElementsByTagName('tr');
      for (let i = 1; i < raws.length; i++) {
        const row = raws[i].getElementsByTagName('td');
        // 비공개 숨김처리
        if (!privateVisible && row[7].textContent === '비공개') continue;

        const world: World = {
          key: row[9].textContent || '', // 키 값
          name: row[1].textContent || '', // 월드 이름
          author: row[2].textContent || '', // 제작자 이름
          description: row[3].textContent || '', // 설명
          tags:
            row[4].textContent!.replaceAll(' ', '').slice(1).split('#') || [], // 태그
          score: Number(row[5].textContent) || 0, // 별점
          url: row[6].textContent || '', // 링크
          imageUrl: row[0].textContent || '',
          // row[0].getElementsByTagName('img')[0]?.getAttribute('src') || '', // 이미지
          date: new Date(row[8].textContent + 'z' || ''), // 기록 날짜
          type: row[7].textContent || '', // 카테고리
        };
        // console.log(world);
        worldData.push(world);
      }
      // console.log(worldData);
      return worldData;
    })
    .catch((reason) => {
      if (axios.isAxiosError(reason)) {
        console.warn('Error: Fail Fetch html', reason);
      } else if (reason instanceof NoDataError) {
        console.warn('Error: Success Fetch html but No Data', reason);
      } else {
        console.warn('Error: Unknown Error', reason);
      }
      // console.log(worldData);
      return worldData;
    });
}

export function getTagStyles() {
  const tagStyles: TagStyle[] = [];
  return getHtml(sheetTagUrl)
    .then((html) => {
      if (!html) throw new NoDataError();

      const doc = domparser.parseFromString(html.data, 'text/html');
      const raws = doc
        .getElementsByTagName('tbody')[0]
        .getElementsByTagName('tr');
      for (let i = 1; i < raws.length; i++) {
        const row = raws[i].getElementsByTagName('td');
        // console.log(rows);
        const tagStyle: TagStyle = {
          tag: row[0].textContent || '',
          content:
            row[1].textContent!.replaceAll(' ', '').slice(1).split('#') || [],
          color: row[2].textContent || '',
          key: row[3].textContent || '',
        };
        tagStyles.push(tagStyle);
      }
      console.log(tagStyles);
      return tagStyles;
    })
    .catch((reason) => {
      if (axios.isAxiosError(reason)) {
        console.warn('Error: Fail Fetch html', reason);
      } else if (reason instanceof NoDataError) {
        console.warn('Error: Success Fetch html but No Data', reason);
      } else {
        console.warn('Error: Unknown Error', reason);
      }
      return tagStyles;
    });
}
