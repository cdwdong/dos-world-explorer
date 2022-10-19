import { useFavoritedWorld } from '@src/renderer/data/favoritedWorld';
import { worldDataState } from '@src/renderer/data/world';
import convertLimitedWorldToDosWorld from '@src/renderer/utils/vrc/convertLimitedWorldToDosWorld';
import {
  addEditSheetToMain,
  getWorldDataToMain,
} from '@src/renderer/utils/ipc/editSheetToMain';
import { World, WorldEditInput, WorldPartial } from '@src/types';
import { message } from 'antd';
import { useEffect, useMemo, useState } from 'react';
import { useRecoilState } from 'recoil';
import { FavoriteGroup, LimitedWorld } from 'vrchat';

interface HookMember {
  isLoading: boolean;
  currentTableData: LimitedWorld[];
  currentPage: number;
  infoModalWorld?: WorldPartial;
  addModalWorld?: WorldPartial;
  typeList: string[];
  currentTab: string;
  favoriteTabs: FavoriteGroup[];

  onClickRefresh(): void;
  onChangePage(page: number): void;
  onOpenAddWorldModal(world: LimitedWorld): void;
  onCloseAddWorldModal(): void;
  onOpenWorldInfoModal(world: LimitedWorld): void;
  onCloseWorldInfoModal(): void;
  onAddWorld(world: WorldEditInput): void;
  onClickChangeTab(tabKey: string): void;
}

const useWorldFavoritePage = (): HookMember => {
  const [worldData, setWorldData] = useRecoilState(worldDataState);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [currentTabId, setCurrentTabId] = useState<string>();
  const [infoModalWorld, setInfoModalWorld] = useState<WorldPartial>();
  const [addModalWorld, setAddModalWorld] = useState<WorldPartial>();
  const favoritedWorldHookMember = useFavoritedWorld();

  const favoriteTabs = useMemo(
    () =>
      favoritedWorldHookMember.favoritedWorlds?.map((f) => f.groupInfo) || [],
    [favoritedWorldHookMember.favoritedWorlds],
  );

  const typeList = useMemo(
    () =>
      worldData?.reduce((acc, cur) => {
        if (acc.find((e) => e === cur.type)) {
          return acc;
        }
        return acc.concat(cur.type);
      }, [] as string[]) || [],
    [worldData],
  );

  const currentTableData = useMemo(
    () =>
      favoritedWorldHookMember.favoritedWorlds
        ?.filter((f) => f.groupInfo.name === currentTabId)
        .flatMap((f) => f.favorites) || [],
    [currentTabId, favoritedWorldHookMember.favoritedWorlds],
  );

  useEffect(() => {
    if (worldData === undefined) {
      getWorldDataToMain().then((data) => {
        return setWorldData(data);
      });
    }
  }, [setWorldData, worldData]);

  useEffect(() => {
    if (favoritedWorldHookMember.favoritedWorlds && worldData !== undefined) {
      setIsLoading(false);
    }
  }, [favoritedWorldHookMember.favoritedWorlds, worldData]);

  useEffect(() => {
    if (!currentTabId && favoriteTabs.length > 0) {
      setCurrentTabId(favoriteTabs[0]?.name || '');
    }
  }, [favoriteTabs, currentTabId]);

  const hookMember: HookMember = {
    isLoading,
    currentTableData: currentTableData || [],
    currentPage,
    infoModalWorld,
    addModalWorld,
    typeList,
    currentTab: currentTabId || '',
    favoriteTabs,

    onClickRefresh(): void {
      setIsLoading(true);
      favoritedWorldHookMember.refresh().then(() => setIsLoading(false));
    },
    onChangePage(page: number): void {
      setCurrentPage(page);
    },
    onOpenAddWorldModal(world: LimitedWorld): void {
      setAddModalWorld(convertLimitedWorldToDosWorld(world));
    },
    onCloseAddWorldModal(): void {
      setAddModalWorld(undefined);
    },
    onOpenWorldInfoModal(world: LimitedWorld): void {
      setInfoModalWorld(convertLimitedWorldToDosWorld(world));
    },
    onCloseWorldInfoModal(): void {
      setInfoModalWorld(undefined);
    },
    onAddWorld(world: WorldEditInput): void {
      addEditSheetToMain(world)
        .then(() => message.info('월드가 추가되었습니다'))
        .then(() => getWorldDataToMain())
        .then((data) => setWorldData(data))
        .catch((e: Error) => message.error(e.toString()));
    },
    onClickChangeTab(tabId: string): void {
      setCurrentTabId(tabId);
    },
  };
  return hookMember;
};
export default useWorldFavoritePage;
