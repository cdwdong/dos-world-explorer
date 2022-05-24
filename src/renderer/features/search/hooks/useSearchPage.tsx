import { worldFavoritesState } from '@src/renderer/data/favorites';
import { searchTextState, worldDataState } from '@src/renderer/data/world';
import getSheetWorldData from '@src/renderer/utils/getSheetWorldData';
import {
  addEditSheetToMain,
  reomoveEditSheetToMain,
} from '@src/renderer/utils/ipc/editSheetToMain';
import openExternalLink from '@src/renderer/utils/ipc/openExternalLink';
import { World, WorldEditInput } from '@src/types';
import { message } from 'antd';
import { useEffect, useState } from 'react';
import { useRecoilState } from 'recoil';

const SEARCH_OPTIONS = ['NAME', 'AUTHOR', 'DESCRIPTION', 'TAG'] as const;
type SearchOptions = typeof SEARCH_OPTIONS;

interface HookMember {
  currentType: string;
  isLoading: boolean;
  typeList: string[];
  currentTableData: World[];
  visibleAddWorldModal: boolean;
  visibleWorldInfoModal: boolean;
  keyOfWorldInfoModal: string;
  searchOptions: SearchOptions;

  onChangeSheetTab: (tabKey: string) => void;
  onClickUrl: (url: string) => void;
  onSearchWorlds: (text: string) => void;
  onClickOpenAddWorldModal: () => void;
  onClickCloseAddWorldModal: () => void;
  onAddWorld: (world: WorldEditInput) => void;
  onRemoveWorld: (key: string) => void;
  onClickRefresh: () => void;
  onClickOpenWorldInfoModal: (key: string) => void;
  onClickCloseWorldInfoModal: () => void;
  onClickFavorite: (world: World) => void;
  checkIsFavorite: (world: World) => boolean;
}
const useSearch = (): HookMember => {
  const [currentType, setCurrentType] = useState<string>('전체');
  const [worldData, setWorldData] = useRecoilState(worldDataState);
  const [searchText, setSearchText] = useRecoilState(searchTextState);
  const [isLoading, setIsLoading] = useState(worldData === undefined);
  const [visibleAddWorldModal, setVisibleAddWorldModal] = useState(false);
  const [visibleWorldInfoModal, setVisibleWorldInfoModal] = useState(false);
  const [keyOfWorldInfoModal, setKeyOfWorldInfoModal] = useState<string>('');
  const [favorites, setFavorites] = useRecoilState(worldFavoritesState);

  useEffect(() => {
    if (worldData === undefined) {
      getSheetWorldData().then((data) => {
        setIsLoading(false);
        return setWorldData(data);
      });
    }
  }, [setWorldData, worldData]);

  const typeList =
    worldData?.reduce(
      (acc, cur) => {
        if (acc.find((e) => e === cur.type)) {
          return acc;
        }
        return acc.concat(cur.type);
      },
      ['전체'],
    ) || [];

  const currentTableData = (
    worldData
      ?.filter((w) => {
        if (currentType === '전체') {
          return true;
        }
        return w.type === currentType;
      })
      .filter((e) =>
        searchText.trim() === ''
          ? true
          : e.name.toLowerCase().search(searchText.toLowerCase()) !== -1,
      ) || []
  ).reverse();

  return {
    currentType,
    isLoading,
    typeList,
    currentTableData,
    visibleAddWorldModal,
    visibleWorldInfoModal,
    keyOfWorldInfoModal,
    searchOptions: SEARCH_OPTIONS,

    onChangeSheetTab(tabKey) {
      setCurrentType(tabKey);
    },
    onClickUrl(url) {
      // openExternalLink(url);
    },
    onSearchWorlds(text) {
      setSearchText(text);
    },
    onClickOpenAddWorldModal() {
      setVisibleAddWorldModal(true);
    },
    onClickCloseAddWorldModal() {
      setVisibleAddWorldModal(false);
    },
    onAddWorld(world) {
      addEditSheetToMain(world).then(() => {
        message.info('월드가 추가되었습니다');
      });
    },
    onRemoveWorld(key) {
      reomoveEditSheetToMain(key).then(() => {
        message.info('월드가 삭제되었습니다');
      });
    },
    onClickRefresh() {
      setIsLoading(true);
      getSheetWorldData().then((data) => {
        setIsLoading(false);
        return setWorldData(data);
      });
    },
    onClickOpenWorldInfoModal(worldKey) {
      setVisibleWorldInfoModal(true);
      setKeyOfWorldInfoModal(worldKey);
    },
    onClickCloseWorldInfoModal() {
      setVisibleWorldInfoModal(false);
    },
    onClickFavorite(world) {
      if (!favorites) {
        message.loading('Favorite 불러오는 중');
        return;
      }
      setFavorites((v) => {
        const val = { ...v };
        val.favorite1 = [...val.favorite1];
        if (val.favorite1.find((e) => e.key === world.key)) {
          val.favorite1 = val.favorite1.filter((e) => e.key !== world.key);
          return val;
        }
        val.favorite1.push(world);
        return val;
      });
    },
    checkIsFavorite(world) {
      if (favorites?.favorite1) {
        return favorites.favorite1.find((e) => e.key === world.key)
          ? true
          : false;
      }
      return false;
    },
  };
};

export default useSearch;