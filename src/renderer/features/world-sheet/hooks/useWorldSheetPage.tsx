/* eslint-disable consistent-return */
/* eslint-disable array-callback-return */
import { useVrcCurrentUser } from '@src/renderer/data/user';
import { worldDataState } from '@src/renderer/data/world';
import getSheetWorldData from '@src/renderer/utils/getSheetWorldData';
import {
  addEditSheetToMain,
  getWorldDataToMain,
  modifyEditSheetToMain,
  reomoveEditSheetToMain,
} from '@src/renderer/utils/ipc/editSheetToMain';
import stringEscape from '@src/renderer/utils/stringEscape';
import { AuthType, World, WorldEditInput, WorldPartial } from '@src/types';
import { message } from 'antd';
import { useEffect, useMemo, useState } from 'react';
import { useRecoilState } from 'recoil';

const SEARCH_OPTIONS = ['NAME', 'AUTHOR', 'DESCRIPTION', 'TAG'] as const;
export type SearchOptions = typeof SEARCH_OPTIONS;

interface HookMember {
  authType: AuthType;
  currentType: string;
  currentPage: number;
  isLoading: boolean;
  typeList: string[];
  currentTableData: World[];
  visibleAddWorldModal: boolean;
  infoModalWorld: World | undefined;
  editModalWorld: WorldPartial | undefined;
  searchOptions: SearchOptions;

  onChangeSheetTab: (tabKey: string) => void;
  onChangePage: (page: number) => void;
  onOpenAddWorldModal: () => void;
  onCloseAddWorldModal: () => void;
  onOpenEditWorldModal: (world: WorldPartial) => void;
  onCloseEditWorldModal: () => void;
  onAddWorld: (world: WorldEditInput) => void;
  onEditWorld: (key: string, world: WorldEditInput) => void;
  onRemoveWorld: (key: string) => void;
  onClickRefresh: () => void;
  onClickOpenWorldInfoModal: (world: World) => void;
  onCloseWorldInfoModal: () => void;
  onSearchWorlds: (text: string) => void;
  onChangeSearchOption: (option: SearchOptions[number]) => void;
}
const useWorldSheetPage = (): HookMember => {
  const userHookMember = useVrcCurrentUser();

  const [currentPage, setCurrentPage] = useState<number>(1);
  const [currentType, setCurrentType] = useState<string>('전체');
  const [worldData, setWorldData] = useRecoilState(worldDataState);
  const [searchText, setSearchText] = useState<string>();
  const [isLoading, setIsLoading] = useState(worldData === undefined);
  const [visibleAddWorldModal, setVisibleAddWorldModal] = useState(false);
  const [infoModalWorld, setInfoModalWorld] = useState<World | undefined>(
    undefined,
  );
  const [editModalWorld, setEditModalWorld] = useState<
    WorldPartial | undefined
  >();
  const [curSearchOption, setCurSearchOption] =
    useState<SearchOptions[number]>('NAME');

  const getWorlds = getWorldDataToMain;
  // useMemo(
  //   () =>
  //     userHookMember.currentAuthType === 'USER' ||
  //     userHookMember.currentAuthType === 'MODERATOR'
  //       ? () => getSheetWorldData(userHookMember.currentAuthType !== 'USER')
  //       : getWorldDataToMain,
  //   [userHookMember.currentAuthType],
  // );
  useEffect(() => {
    if (worldData === undefined) {
      getWorlds().then((data) => {
        setIsLoading(false);
        return setWorldData(data);
      });
    }
  }, [getWorlds, setWorldData, worldData]);

  const typeList = useMemo(
    () =>
      worldData
        ?.reduce(
          (acc, cur) => {
            if (acc.find((e) => e === cur.type)) {
              return acc;
            }
            return acc.concat(cur.type);
          },
          ['전체'],
        )
        .filter((e) =>
          userHookMember.currentAuthType === 'USER' ? e !== '비공개' : true,
        ) || [],
    [userHookMember.currentAuthType, worldData],
  );
  const currentTableData = useMemo(() => {
    const searchedWorldData =
      worldData
        ?.filter((w) => {
          if (currentType === '전체') {
            return true;
          }
          return w.type === currentType;
        })
        .filter((e) => {
          if (!searchText || searchText.trim() === '') {
            return true;
          }
          const words = searchText.split(' ');
          const trimedText = searchText.trim();

          switch (curSearchOption) {
            case 'NAME':
              return (
                e.name.toLowerCase().search(trimedText.toLowerCase()) !== -1
              );
            case 'AUTHOR':
              return (
                e.author.toLowerCase().search(trimedText.toLowerCase()) !== -1
              );
            case 'DESCRIPTION':
              return (
                e.description.toLowerCase().search(trimedText.toLowerCase()) !==
                -1
              );
            case 'TAG':
              return (
                e.tags.filter((t) => words.lastIndexOf(t) !== -1).length ===
                words.length
              );
          }
        })
        .reverse() || [];
    return searchedWorldData;
  }, [curSearchOption, currentType, searchText, worldData]);

  return {
    authType: userHookMember.currentAuthType,
    currentType,
    currentPage,
    isLoading,
    typeList,
    currentTableData,
    visibleAddWorldModal,
    infoModalWorld: infoModalWorld,
    editModalWorld: editModalWorld,
    searchOptions: SEARCH_OPTIONS,

    onChangeSheetTab(tabKey) {
      setCurrentType(tabKey);
      setCurrentPage(1);
    },
    onChangePage(page) {
      setCurrentPage(page);
    },
    onSearchWorlds(text) {
      const escapedText = stringEscape(text);
      setSearchText(escapedText);
    },
    onOpenAddWorldModal() {
      setVisibleAddWorldModal(true);
    },
    onCloseAddWorldModal() {
      setVisibleAddWorldModal(false);
    },
    onOpenEditWorldModal(world) {
      setEditModalWorld(world);
    },
    onCloseEditWorldModal() {
      setEditModalWorld(undefined);
    },
    onAddWorld(world) {
      if (userHookMember.currentAuthType !== 'ADMIN') {
        message.error('어드민이 아닙니다.');
        return;
      }

      setIsLoading(true);
      addEditSheetToMain(world)
        .then(() => message.info('월드가 추가되었습니다'))
        .then(() => getWorlds())
        .then((data) => setWorldData(data))
        .catch((e: Error) => message.error(e.toString()))
        .finally(() => setIsLoading(false));
    },
    onEditWorld(key, world) {
      if (userHookMember.currentAuthType !== 'ADMIN') {
        message.error('어드민이 아닙니다.');
        return;
      }

      setIsLoading(true);
      modifyEditSheetToMain(key, world)
        .then(() => message.info('월드가 변경되었습니다'))
        .then(() => getWorlds())
        .then((data) => setWorldData(data))
        .catch((e: Error) => message.error(e.toString()))
        .finally(() => setIsLoading(false));
    },
    onRemoveWorld(key) {
      if (userHookMember.currentAuthType !== 'ADMIN') {
        message.error('어드민이 아닙니다.');
        return;
      }

      setIsLoading(true);
      reomoveEditSheetToMain(key)
        .then(() => message.info('월드가 삭제되었습니다'))
        .then(() => getWorlds())
        .then((data) => setWorldData(data))
        .catch((e: Error) => message.error(e.toString()))
        .finally(() => setIsLoading(false));
    },
    onClickRefresh() {
      setIsLoading(true);
      getWorlds()
        .then((data) => {
          return setWorldData(data);
        })
        .finally(() => setIsLoading(false));
    },
    onClickOpenWorldInfoModal(w) {
      setInfoModalWorld(w);
    },
    onCloseWorldInfoModal() {
      setInfoModalWorld(undefined);
    },
    onChangeSearchOption(option) {
      setCurSearchOption(option);
    },
  };
};

export default useWorldSheetPage;
