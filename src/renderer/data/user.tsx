/* eslint-disable promise/no-nesting */
import { AuthType, UserLogin } from '@src/types';
import { message } from 'antd';
import { useDebugValue, useEffect } from 'react';
import { atom, AtomEffect, useRecoilState, useResetRecoilState } from 'recoil';
import { CurrentUser } from 'vrchat';
import {
  autoLoginToMain,
  getCurrentUserToMain,
  loginToMain,
  logoutToMain,
  verify2FAcodeToMain,
  verify2FAEmailCodeToMain,
} from '../utils/ipc/vrchatAPIToMain';
import { getCanGetSheetAuthToMain } from '../utils/ipc/editSheetToMain';

// const USER_LOGIN_LOCALSTORAGE_KEY = 'USER_LOGIN';

const vrcCurrentUserEffect =
  (): AtomEffect<CurrentUser | undefined> =>
  ({ trigger, onSet, setSelf, resetSelf }) => {
    // TODO: 자동로그인 함수사용하여 고칠것
    autoLoginToMain()
      .then((result) => {
        return getCurrentUserToMain();
      })
      .then((currentUser) => {
        setSelf(currentUser);
      })
      .catch((reason) => console.error('Login Error: ', reason.toString()));
  };

const currentUserState = atom<CurrentUser | undefined>({
  key: 'currentUserState',
  default: undefined,
  effects: [vrcCurrentUserEffect()],
});

const isAdminState = atom<boolean>({
  key: 'isAdminState',
  default: false,
});

export interface VrcCurrentUserHookMember {
  currentUser: CurrentUser | undefined;
  currentAuthType: AuthType;
  login(userLogin: UserLogin): Promise<CurrentUser>;
  logout(): Promise<void>;
  doTwoFactorAuth(twoFactorCode: string): Promise<void>;
  doTFAEmail(code: string): Promise<void>;
}
export const useVrcCurrentUser = (): VrcCurrentUserHookMember => {
  const [currentUser, setCurrentUser] = useRecoilState(currentUserState);
  const resetUser = useResetRecoilState(currentUserState);
  const [isAdmin, setIsAdmin] = useRecoilState(isAdminState);
  useDebugValue(currentUser);

  useEffect(() => {
    const id = setInterval(
      () => getCurrentUserToMain().then((user) => setCurrentUser(user)),
      5000,
    );
    return clearInterval(id);
  }, [setCurrentUser]);

  useEffect(() => {
    if (isAdmin) return;
    getCanGetSheetAuthToMain()
      .then((auth) => {
        setIsAdmin(auth);
      })
      .catch((reason) => {
        setIsAdmin(false);
      });
  }, [isAdmin, setIsAdmin]);

  const hookMember: VrcCurrentUserHookMember = {
    currentUser: currentUser,
    currentAuthType: isAdmin ? 'ADMIN' : 'USER',
    async login(userLogin: UserLogin): Promise<CurrentUser> {
      const user = await login(userLogin);
      setCurrentUser(user);
      return user;
    },
    async logout(): Promise<void> {
      await logout();
      resetUser();
    },
    async doTwoFactorAuth(twoFactorCode: string): Promise<void> {
      await verify2FAcodeToMain(twoFactorCode);
    },
    async doTFAEmail(code: string): Promise<void> {
      await verify2FAEmailCodeToMain(code);
    },
  };

  return hookMember;
};

async function login(userLogin: UserLogin): Promise<CurrentUser> {
  await loginToMain(userLogin.name, userLogin.password);
  const user = await getCurrentUserToMain();

  return user;
}

async function logout(): Promise<void> {
  await logoutToMain();
}
