import type { Container, ObjToProxyMap } from '../types';

/** @internal */
export interface RootContainerOwner {
  $rootContainer$: Container | null;
}

/** @internal */
export interface InnerContainer extends Container, RootContainerOwner {
  $storeProxyMap$: ObjToProxyMap;
  _didAddQwikLoader?: boolean;
}

const hasRootContainer = (container: Container): container is Container & RootContainerOwner => {
  return '$rootContainer$' in container;
};

/** @internal */
export const getRootContainer = (container: Container): Container => {
  const rootContainer = hasRootContainer(container) ? container.$rootContainer$ : null;
  return rootContainer || container;
};

/** @internal */
export const isSameContainer = (left: Container, right: Container | null): boolean => {
  return getRootContainer(left) === (right ? getRootContainer(right) : null);
};
