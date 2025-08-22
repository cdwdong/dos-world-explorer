import { worldDataState } from '@src/renderer/data/world';
import convertLimitedWorldToDosWorld from '@src/renderer/utils/vrc/convertLimitedWorldToDosWorld';
import {
  addEditSheetToMain,
  getWorldDataToMain,
} from '@src/renderer/utils/ipc/editSheetToMain';
import {
  getVrchatlabWorldsToMain,
  getVrchatNewWorldsToMain,
  getVrchatRecentWorldsToMain,
} from '@src/renderer/utils/ipc/vrchatAPIToMain';
import { World, WorldEditInput, WorldPartial } from '@src/types';
import { message } from 'antd';
import { useEffect, useMemo, useState } from 'react';
import { useRecoilState } from 'recoil';
import { LimitedWorld } from 'vrchat';
import { useVrcCurrentUser } from '@src/renderer/data/user';

export type TabKey = 'new' | 'lab' | 'recent';

interface HookMember {
  isLoading: boolean;
  currentTableData: LimitedWorld[];
  currentPage: number;
  infoModalWorld?: WorldPartial;
  addModalWorld?: WorldPartial;
  typeList: string[];
  queryLimit: number;
  currentTab: string;

  onClickRefresh(): void;
  onChangePage(page: number): void;
  onOpenAddWorldModal(world: WorldPartial): void;
  onCloseAddWorldModal(): void;
  onOpenWorldInfoModal(world: LimitedWorld): void;
  onCloseWorldInfoModal(): void;
  onAddWorld(world: WorldEditInput): void;
  onClickLoadMore(): void;
  onChangeQueryLimit(limit: number): void;
  onClickChangeTab(tab: TabKey): void;
}

const useWorldExplorePage = (): HookMember => {
  const [worldData, setWorldData] = useRecoilState(worldDataState);
  const [newWorlds, setNewWorlds] = useState<LimitedWorld[]>([]);
  const [labWorlds, setLabWorlds] = useState<LimitedWorld[]>([]);
  const [recentWorlds, setRecentWorlds] = useState<LimitedWorld[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [queryLimit, setQueryLimit] = useState(30);
  const [currentTab, setCurrentTab] = useState<TabKey>('recent');
  const [infoModalWorld, setInfoModalWorld] = useState<WorldPartial>();
  const [addModalWorld, setAddModalWorld] = useState<WorldPartial>();

  const userHookMember = useVrcCurrentUser();

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
        return setWorldData(data);
      });
    }
  }, [getWorlds, setWorldData, worldData]);

  useEffect(() => {
    setIsLoading(true);
    Promise.all([
      getVrchatNewWorldsToMain(0, queryLimit).then((w) => {
        setNewWorlds(w);
      }),
      getVrchatlabWorldsToMain(0, queryLimit).then((w) => {
        setLabWorlds(w);
      }),
      getVrchatRecentWorldsToMain(0, queryLimit).then((w) => {
        setRecentWorlds(w);
      }),
    ]).then(() => setIsLoading(false));

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  let currentTableData;
  switch (currentTab) {
    case 'lab':
      currentTableData = labWorlds;
      break;
    case 'new':
      currentTableData = newWorlds;
      break;
    case 'recent':
      currentTableData = recentWorlds;
      break;
  }

  const hookMember: HookMember = {
    isLoading,
    currentTableData: currentTableData || [],
    currentPage,
    infoModalWorld,
    addModalWorld,
    typeList,
    queryLimit,
    currentTab,

    onClickRefresh(): void {
      setIsLoading(true);
      Promise.all([
        getVrchatNewWorldsToMain(0, queryLimit).then((w) => {
          setNewWorlds(w);
        }),
        getVrchatlabWorldsToMain(0, queryLimit).then((w) => {
          setLabWorlds(w);
        }),
        getVrchatRecentWorldsToMain(0, queryLimit).then((w) => {
          setRecentWorlds(w);
        }),
      ]).then(() => setIsLoading(false));
    },
    onChangePage(page: number): void {
      setCurrentPage(page);
    },
    onOpenAddWorldModal(world: WorldPartial): void {
      setAddModalWorld(world);
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
      if (userHookMember.currentAuthType !== 'ADMIN') {
        message.error('어드민이 아닙니다.');
        return;
      }

      addEditSheetToMain(world)
        .then(() => message.info('월드가 추가되었습니다'))
        .then(() => getWorlds())
        .then((data) => setWorldData(data))
        .catch((e: Error) => message.error(e.toString()));
    },
    onClickLoadMore(): void {
      setIsLoading(true);
      Promise.all([
        getVrchatNewWorldsToMain(newWorlds.length, queryLimit).then((w) => {
          setNewWorlds((old) => old.concat(w));
        }),
        getVrchatlabWorldsToMain(labWorlds.length, queryLimit).then((w) => {
          setLabWorlds((old) => old.concat(w));
        }),
        getVrchatRecentWorldsToMain(recentWorlds.length, queryLimit).then(
          (w) => {
            setRecentWorlds((old) => old.concat(w));
          },
        ),
      ]).then(() => setIsLoading(false));
    },
    onClickChangeTab(tab: TabKey): void {
      setCurrentTab(tab);
    },
    onChangeQueryLimit(limit: number): void {
      setQueryLimit(limit);
    },
  };
  return hookMember;
};
export default useWorldExplorePage;
