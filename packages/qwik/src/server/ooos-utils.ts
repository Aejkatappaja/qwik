import type { EffectSubscription, ObjToProxyMap, SerializationContext } from './qwik-types';

export type ExternalRootEffectProp = string | symbol | null;

export interface ExternalRootEffectEntry {
  rootObj: unknown;
  rootId: number | undefined;
  effect: EffectSubscription;
  effectRootId: number;
  prop: ExternalRootEffectProp;
  propObj?: ExternalRootEffectProp;
  propRootId?: number;
}

export type ExternalRootEffects = ExternalRootEffectEntry[];

export type ExternalRootEffectsDeltaProp = null | string | [number];
export type ExternalRootEffectsDeltaEffects = [ExternalRootEffectsDeltaProp, number[]];
export type ExternalRootEffectsDeltaEntry = [number, ExternalRootEffectsDeltaEffects[]];
export type ExternalRootEffectsDelta = ExternalRootEffectsDeltaEntry[];

export const recordExternalRootEffect = (
  rootCtx: SerializationContext,
  segmentCtx: SerializationContext,
  storeProxyMap: ObjToProxyMap,
  records: ExternalRootEffects | null,
  producer: unknown,
  effect: EffectSubscription,
  prop: ExternalRootEffectProp,
  sourceEffects?: Map<string | symbol, Set<EffectSubscription>>
): void => {
  if (!records || (prop !== null && !sourceEffects)) {
    return;
  }
  let rootObj = producer;
  if (
    prop !== null &&
    producer &&
    (typeof producer === 'object' || typeof producer === 'function')
  ) {
    rootObj = storeProxyMap.get(producer as object) || producer;
  }
  const rootId = rootCtx.$hasRootId$(rootObj);
  segmentCtx.$addRoot$(rootObj);
  records.push({
    rootObj,
    rootId,
    effect,
    effectRootId: segmentCtx.$addRoot$(effect),
    prop,
    propObj: prop,
    propRootId: prop !== null && typeof prop !== 'string' ? segmentCtx.$addRoot$(prop) : undefined,
  });
};

export const collectExternalRootEffectsDelta = (
  rootCtx: SerializationContext,
  segmentCtx: SerializationContext,
  records: ExternalRootEffects | null,
  rootLimit: number,
  rootIdMap: number[]
): ExternalRootEffectsDelta | undefined => {
  if (!records?.length) {
    return;
  }
  const delta: ExternalRootEffectsDelta = [];
  const deltaByRoot = new Map<
    number,
    {
      entry: ExternalRootEffectsDeltaEntry;
      byProp: Map<ExternalRootEffectProp, ExternalRootEffectsDeltaEffects>;
    }
  >();
  for (let i = 0; i < records.length; i++) {
    const entry = records[i];
    const rootId = entry.rootId === undefined ? rootCtx.$hasRootId$(entry.rootObj) : entry.rootId;
    if (rootId === undefined || rootId >= rootLimit) {
      continue;
    }
    let rootDelta = deltaByRoot.get(rootId);
    if (!rootDelta) {
      rootDelta = { entry: [rootId, []], byProp: new Map() };
      deltaByRoot.set(rootId, rootDelta);
      delta.push(rootDelta.entry);
    }
    let prop: ExternalRootEffectsDeltaProp;
    if (entry.prop === null) {
      prop = null;
    } else if (typeof entry.prop === 'string') {
      prop = entry.prop;
    } else {
      prop = [rootIdMap[segmentCtx.$addRoot$(entry.propObj!)]];
    }
    let effects = rootDelta.byProp.get(entry.prop);
    if (!effects) {
      effects = [prop, []];
      rootDelta.byProp.set(entry.prop, effects);
      rootDelta.entry[1].push(effects);
    }
    const effectRootId = rootIdMap[segmentCtx.$addRoot$(entry.effect)];
    if (effects[1].indexOf(effectRootId) === -1) {
      effects[1].push(effectRootId);
    }
  }
  return delta.length ? delta : undefined;
};
