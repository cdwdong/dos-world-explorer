import { worldDataState } from '@src/renderer/data/world';
import convertLimitedWorldToDosWorld from '@src/renderer/utils/convertLimitedWorldToDosWorld';
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

export type TabKey = 'new' | 'lab' | 'recent';

interface HookMember {
  isLoading: boolean;
  currentTableData: WorldPartial[];
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
  onOpenWorldInfoModal(world: WorldPartial): void;
  onCloseWorldInfoModal(): void;
  onAddWorld(world: WorldEditInput): void;
  onClickLoadMore(): void;
  onChangeQueryLimit(limit: number): void;
  onClickChangeTab(tab: TabKey): void;
}

const useWorldExplorePage = (): HookMember => {
  const [worldData, setWorldData] = useRecoilState(worldDataState);
  const [newWorlds, setNewWorlds] = useState<WorldPartial[]>([]);
  const [labWorlds, setLabWorlds] = useState<WorldPartial[]>([]);
  const [recentWorlds, setRecentWorlds] = useState<WorldPartial[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [queryLimit, setQueryLimit] = useState(30);
  const [currentTab, setCurrentTab] = useState<TabKey>('recent');
  const [infoModalWorld, setInfoModalWorld] = useState<WorldPartial>();
  const [addModalWorld, setAddModalWorld] = useState<WorldPartial>();

  useEffect(() => {
    if (worldData === undefined) {
      getWorldDataToMain().then((data) => {
        return setWorldData(data);
      });
    }
  }, [setWorldData, worldData]);

  useEffect(() => {
    setIsLoading(true);
    Promise.all([
      getVrchatNewWorldsToMain(0, queryLimit).then((w) => {
        setNewWorlds(w.map(convertLimitedWorldToDosWorld));
      }),
      getVrchatlabWorldsToMain(0, queryLimit).then((w) => {
        setLabWorlds(w.map(convertLimitedWorldToDosWorld));
      }),
      getVrchatRecentWorldsToMain(0, queryLimit).then((w) => {
        setRecentWorlds(w.map(convertLimitedWorldToDosWorld));
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
          setNewWorlds(w.map(convertLimitedWorldToDosWorld));
        }),
        getVrchatlabWorldsToMain(0, queryLimit).then((w) => {
          setLabWorlds(w.map(convertLimitedWorldToDosWorld));
        }),
        getVrchatRecentWorldsToMain(0, queryLimit).then((w) => {
          setRecentWorlds(w.map(convertLimitedWorldToDosWorld));
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
    onOpenWorldInfoModal(world: WorldPartial): void {
      setInfoModalWorld(world);
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
    onClickLoadMore(): void {
      setIsLoading(true);
      Promise.all([
        getVrchatNewWorldsToMain(newWorlds.length, queryLimit).then((w) => {
          setNewWorlds((old) =>
            old.concat(w.map(convertLimitedWorldToDosWorld)),
          );
        }),
        getVrchatlabWorldsToMain(labWorlds.length, queryLimit).then((w) => {
          setLabWorlds((old) =>
            old.concat(w.map(convertLimitedWorldToDosWorld)),
          );
        }),
        getVrchatRecentWorldsToMain(recentWorlds.length, queryLimit).then(
          (w) => {
            setRecentWorlds((old) =>
              old.concat(w.map(convertLimitedWorldToDosWorld)),
            );
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
