import '@testing-library/jest-dom';
import { render } from '@testing-library/react';
import { World, WorldData } from '@src/types';
import App from '../renderer/App';

jest.setTimeout(300000);

describe('App', () => {
  it('should render', () => {
    expect(render(<App />)).toBeTruthy();
  });
});

// describe('getSheetWorldData', () => {
//   it('crawling world sheet', async () => {
//     return getSheetWorldData()
//       .then((result) => console.log('result', result))
//       .catch((err) => console.log('error', err));
//   });
// });

// describe('addEditSheet', () => {
//   const testworld: World = {
//     key: '=Image("https://d348imysud55la.cloudfront.net/thumbnails/file_31f841f2-617c-4b39-90a3-cd50fe5081d9.2264af1e39e1c532201132b6adc62804758f66cd641cc0fa05931a1118f8c4a1.3.thumbnail-256.png",2)', // 월드 고유ID
//     name: '심심이북극곰의 월드',
//     author: '심심이북극곰',
//     description: '실제로 없는 테스트 월드입니다.',
//     tags: ['테스트1', '테스트2', '테스트3', '테스트4'],
//     score: 6,
//     url: '심심이북극곰.com',
//     imageUrl: '심심이북극곰 이미지.com',
//   };

//   it('addEditSheet', async () => {
//     return addEditSheet(testworld, 'test').then();
//   });
// });

// describe('name1', () => {
//   it('name it1', async () => {
//     // return fsafsafas()
//   });
// });

// describe('name2', () => {
//   it('name it1', async () => {
//     // return fsafsaf()
//   });
// });
