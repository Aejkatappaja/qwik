import { EffectSubscription } from './qwik-types';

export type ExternalRootEffectProp = string | symbol | null;

export interface ExternalRootEffectEntry {
  producer: unknown;
  effect: EffectSubscription;
  prop: ExternalRootEffectProp;
  sourceEffects?: Map<string | symbol, Set<EffectSubscription>>;
}

export type ExternalRootEffects = ExternalRootEffectEntry[];

export const addExternalRootEffectEntry = <K>(
  records: Map<K, ExternalRootEffects> | null,
  key: K,
  entry: ExternalRootEffectEntry
): void => {
  if (!records || (entry.prop !== null && !entry.sourceEffects)) {
    return;
  }
  const entries = records.get(key) || [];
  entries.push(entry);
  records.set(key, entries);
};

export const createExternalRootEffectEntry = (
  producer: unknown,
  effect: EffectSubscription,
  prop: ExternalRootEffectProp,
  sourceEffects?: Map<string | symbol, Set<EffectSubscription>>
): ExternalRootEffectEntry => {
  return {
    producer,
    effect,
    prop,
    sourceEffects,
  };
};
