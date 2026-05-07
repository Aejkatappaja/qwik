import type { Container } from '../shared/types';
import { SignalImpl } from '../reactive-primitives/impl/signal-impl';
import { getStoreHandler, getStoreTarget } from '../reactive-primitives/impl/store';
import type { EffectSubscription } from '../reactive-primitives/types';
import { scheduleEffects } from '../reactive-primitives/utils';
import {
  canRevealRegistration,
  type RevealItemLike,
  type RevealOrder,
  type RevealRegistrationLike,
} from '../shared/utils/reveal';
import { tryGetInvokeContext } from '../use/use-core';

/** @internal */
export const SUSPENSE_QRL_SYMBOL = '_suC';

/** @internal */
export type OutOfOrderRevealBoundary = {
  attrs: string;
  showFallback: boolean;
};

/** @internal */
export type ExternalRootEffectsDelta = Array<
  [number | string, null | string | [number | string], Array<number | string>]
>;

type OutOfOrderRevealOrderCode = 'p' | 's' | 'r' | 't';
const outOfOrderRevealIds = new WeakMap<Container, number>();

/** @internal */
export class OutOfOrderRevealCoordinator<ITEM extends RevealItemLike = RevealItemLike> {
  private count = 0;
  private pendingItems = new Set<ITEM>();
  private orderCode: OutOfOrderRevealOrderCode;

  constructor(
    private id: number,
    order: RevealOrder,
    private collapsed: boolean
  ) {
    this.orderCode = getOutOfOrderRevealOrderCode(order);
  }

  register(registration: RevealRegistrationLike<ITEM>): OutOfOrderRevealBoundary {
    this.pendingItems.add(registration.item);
    const index = this.count++;
    return {
      attrs:
        ` q:g="${this.id}" q:i="${index}" q:o="${this.orderCode}"` + (this.collapsed ? ' q:c' : ''),
      showFallback:
        canRevealRegistration(registration, (item) => this.pendingItems.has(item)) ||
        !this.collapsed,
    };
  }

  script(): string {
    return this.count === 0 ? '' : `qO.g(${this.id},${this.count},"${this.orderCode}");`;
  }
}

/** @internal */
export const createOutOfOrderRevealCoordinator = <ITEM extends RevealItemLike = RevealItemLike>(
  order: RevealOrder,
  collapsed: boolean
): OutOfOrderRevealCoordinator<ITEM> => {
  if (!__EXPERIMENTAL__.suspense) {
    return null!;
  }
  const container = tryGetInvokeContext()?.$container$;
  let id = 0;
  if (container) {
    id = (outOfOrderRevealIds.get(container) || 0) + 1;
    outOfOrderRevealIds.set(container, id);
  }
  return new OutOfOrderRevealCoordinator<ITEM>(id, order, collapsed);
};

const getOutOfOrderRevealOrderCode = (order: RevealOrder): OutOfOrderRevealOrderCode => {
  switch (order) {
    case 'sequential':
      return 's';
    case 'reverse':
      return 'r';
    case 'together':
      return 't';
    default:
      return 'p';
  }
};

/** @internal */
export const isOutOfOrderStreaming = (): boolean => {
  if (!__EXPERIMENTAL__.suspense) {
    return false;
  }
  const container = tryGetInvokeContext()?.$container$ as
    | { readonly outOfOrderStreaming?: boolean }
    | undefined;
  return container?.outOfOrderStreaming === true;
};

/** @internal */
export const nextOutOfOrderSuspenseId = (): number => {
  if (!__EXPERIMENTAL__.suspense) {
    return 0;
  }
  const container = tryGetInvokeContext()?.$container$ as
    | { nextOutOfOrderId?: () => number }
    | undefined;
  return container?.nextOutOfOrderId?.() ?? 0;
};

/** @internal */
export const mergeExternalRootEffects = (
  container: Container,
  effectsDelta: ExternalRootEffectsDelta | undefined
): void => {
  if (!__EXPERIMENTAL__.suspense || !effectsDelta) {
    return;
  }
  for (let i = 0; i < effectsDelta.length; i++) {
    const [rootId, prop, effectIds] = effectsDelta[i];
    const root = container.$getObjectById$(rootId);
    if (root instanceof SignalImpl) {
      mergeExternalRootEffectSet(container, root, root, (root.$effects$ ||= new Set()), effectIds);
    } else {
      const handler = getStoreHandler(root as any);
      const target = getStoreTarget(root as any);
      if (!handler || !target) {
        continue;
      }
      const effectsMap = (handler.$effects$ ||= new Map());
      const storeProp = Array.isArray(prop) ? container.$getObjectById$(prop[0]) : prop;
      if (storeProp === null) {
        continue;
      }
      let rootEffects = effectsMap.get(storeProp as string | symbol);
      if (!rootEffects) {
        rootEffects = new Set();
        effectsMap.set(storeProp as string | symbol, rootEffects);
      }
      mergeExternalRootEffectSet(container, handler, target, rootEffects, effectIds);
    }
  }
};

const mergeExternalRootEffectSet = (
  container: Container,
  producer: unknown,
  backRef: unknown,
  rootEffects: Set<EffectSubscription>,
  effectIds: Array<number | string>
): void => {
  let newEffects: Set<EffectSubscription> | undefined;
  for (let i = 0; i < effectIds.length; i++) {
    const effect = container.$getObjectById$(effectIds[i]) as EffectSubscription;
    if (!rootEffects.has(effect)) {
      rootEffects.add(effect);
      (newEffects ||= new Set()).add(effect);
    }
    (effect.backRef ||= new Set()).add(backRef as any);
  }
  scheduleEffects(container, producer as any, newEffects);
};
