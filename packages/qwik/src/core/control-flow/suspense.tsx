import { isBrowser } from '@qwik.dev/core/build';
import { _wrapProp } from '../reactive-primitives/internal-api';
import type { Signal } from '../reactive-primitives/signal.public';
import { componentQrl } from '../shared/component.public';
import { _jsxSorted } from '../shared/jsx/jsx-internal';
import { Fragment } from '../shared/jsx/jsx-runtime';
import { directGetPropsProxyProp } from '../shared/jsx/props-proxy';
import { Slot } from '../shared/jsx/slot.public';
import type { JSXOutput } from '../shared/jsx/types/jsx-node';
import { isServerPlatform } from '../shared/platform/platform';
import { _fnSignal } from '../shared/qrl/inlined-fn';
import { inlinedQrl } from '../shared/qrl/qrl';
import { _captures } from '../shared/qrl/qrl-class';
import { QCursorBoundary, QSuspenseResolved, QSuspenseResultParent } from '../shared/utils/markers';
import { createInternalServerComponent } from '../ssr/internal-server-component';
import type { SSRContainer, SSRRenderJSXOptions, SSRSlotReplayRecords } from '../ssr/ssr-types';
import { useComputedQrl } from '../use/use-computed';
import { useCursorBoundary, type CursorBoundary } from '../use/use-cursor-boundary';
import { useSignal } from '../use/use-signal';
import { useTaskQrl, type TaskCtx } from '../use/use-task';
import { revealCanReveal, useRevealBoundary, type RevealRegistration } from './reveal';
import {
  isOutOfOrderStreaming,
  nextOutOfOrderSuspenseId,
  SUSPENSE_QRL_SYMBOL,
  type OutOfOrderRevealBoundary,
} from './suspense-utils';

type SuspenseState = 'content' | 'fallback';

/** @public @experimental */
export type SuspenseProps = {
  fallback?: JSXOutput;
  showStale?: boolean;
  delay?: number;
};

const _hf0 = (
  p0: SuspenseProps,
  p1: Signal<SuspenseState>,
  p2: Signal<boolean> | null,
  p3: RevealRegistration | null
) => ({
  display:
    p1.value === 'fallback' &&
    p0.fallback != null &&
    p0.fallback !== false &&
    (p2 === null || p2.value || !p3!.reveal.collapsed)
      ? 'contents'
      : 'none',
});
const _hf0_str =
  '{display:p1.value==="fallback"&&p0.fallback!=null&&p0.fallback!==false&&(p2===null||p2.value||!p3.reveal.collapsed)?"contents":"none"}';
const _hf1 = (p0: SuspenseProps, p1: Signal<SuspenseState>, p2: Signal<boolean> | null) => ({
  display:
    (p2 === null || p2.value) && (p1.value === 'content' || p0.showStale) ? 'contents' : 'none',
});
const _hf1_str =
  '{display:(p2===null||p2.value)&&(p1.value==="content"||p0.showStale)?"contents":"none"}';

/** @internal */
export const suspenseTask = ({ track, cleanup }: TaskCtx) => {
  const cursorBoundary = _captures![0] as CursorBoundary,
    props = _captures![1] as { delay?: number },
    state = _captures![2] as Signal<SuspenseState>,
    revealRegistration = _captures![3] as RevealRegistration | null;
  const pendingCount = track(cursorBoundary.pending);
  const isBrowserEnv = import.meta.env.TEST ? !isServerPlatform() : isBrowser;
  if (revealRegistration !== null && isBrowserEnv) {
    revealRegistration.reveal.version.value++;
  }
  if (!isBrowserEnv || pendingCount === 0) {
    state.value = 'content';
    return;
  }
  const delayTimer = setTimeout(() => {
    if (cursorBoundary.pending.value > 0) {
      state.value = 'fallback';
    }
  }, props.delay ?? 0);
  cleanup(() => clearTimeout(delayTimer));
};

/** @internal */
export const suspenseCmp = (props: SuspenseProps) => {
  if (!__EXPERIMENTAL__.suspense) {
    throw new Error(
      'Suspense is experimental and must be enabled with `experimental: ["suspense"]` in the `qwikVite` plugin.'
    );
  }

  const state = useSignal<SuspenseState>('content');
  const cursorBoundary = useCursorBoundary();
  const revealRegistration = useRevealBoundary(cursorBoundary);
  const canReveal = useComputedQrl(
    /*#__PURE__*/ inlinedQrl(revealCanReveal, '_reR', [revealRegistration])
  );

  useTaskQrl(
    /*#__PURE__*/ inlinedQrl(suspenseTask, '_suT', [
      cursorBoundary,
      props,
      state,
      revealRegistration,
    ])
  );

  const isServerEnv = import.meta.env.TEST ? isServerPlatform() : !isBrowser;
  const isServerOutOfOrder = isServerEnv && isOutOfOrderStreaming();
  const outOfOrderBoundaryId = isServerOutOfOrder ? nextOutOfOrderSuspenseId() : 0;
  const outOfOrderRevealBoundary = isServerOutOfOrder
    ? (revealRegistration?.reveal.ooos?.register(revealRegistration) ?? null)
    : null;

  return /*#__PURE__*/ _jsxSorted(
    Fragment,
    null,
    null,
    [
      /*#__PURE__*/ _jsxSorted(
        'div',
        {
          style: isServerOutOfOrder
            ? {
                display: shouldRenderFallback(props.fallback, outOfOrderRevealBoundary)
                  ? 'contents'
                  : 'none',
              }
            : _fnSignal(_hf0, [props, state, canReveal, revealRegistration], _hf0_str),
        },
        null,
        _wrapProp(props, 'fallback'),
        1,
        null
      ),
      /*#__PURE__*/ _jsxSorted(
        'div',
        null,
        isServerOutOfOrder
          ? {
              [QSuspenseResultParent]: String(outOfOrderBoundaryId),
              style: { display: 'none' },
            }
          : {
              style: _fnSignal(_hf1, [props, state, canReveal], _hf1_str),
            },
        /*#__PURE__*/ _jsxSorted(
          isServerOutOfOrder ? SSRDeferredSlot : Slot,
          isServerOutOfOrder
            ? {
                [QCursorBoundary]: cursorBoundary,
                boundaryId: outOfOrderBoundaryId,
                reveal: outOfOrderRevealBoundary,
              }
            : {
                [QCursorBoundary]: cursorBoundary,
              },
          null,
          null,
          3,
          'u6_0'
        ),
        1,
        null
      ),
    ],
    1,
    'u6_1'
  );
};

/** @public @experimental */
export const Suspense = /*#__PURE__*/ componentQrl<SuspenseProps>(
  /*#__PURE__*/ inlinedQrl(suspenseCmp, SUSPENSE_QRL_SYMBOL)
) as typeof suspenseCmp;

type SSRDeferredSlotProps = {
  boundaryId: number;
  reveal: OutOfOrderRevealBoundary | null;
};

const SSRDeferredSlot = __EXPERIMENTAL__.suspense
  ? /*#__PURE__*/ createInternalServerComponent<SSRDeferredSlotProps>(async (ssr, jsx, options) => {
      const boundaryId =
        directGetPropsProxyProp<number | undefined, unknown>(jsx, 'boundaryId') ??
        ssr.nextOutOfOrderId();
      const contentSegment = `${boundaryId}`;
      const revealBoundary = directGetPropsProxyProp<OutOfOrderRevealBoundary | null, unknown>(
        jsx,
        'reveal'
      );
      const slot = /*#__PURE__*/ _jsxSorted(
        Slot,
        jsx.varProps,
        jsx.constProps,
        jsx.children,
        jsx.flags,
        jsx.key
      );
      const segmentOptions = { ...options };
      const slotReplayRecords: SSRSlotReplayRecords = new Map();
      const content = await ssr.segment(contentSegment, slot, {
        ...segmentOptions,
        promiseMode: 'suspense-capture',
        slotReplay: {
          mode: 'record',
          records: slotReplayRecords,
        },
      });

      writeOutOfOrderPlaceholder(ssr, boundaryId);
      ssr.emitOutOfOrderExecutorIfNeeded();

      if (content.suspended) {
        await ssr.streamHandler.flush();
        ssr.queueOutOfOrderSegment(
          emitResolvedOutOfOrderSegment(
            ssr,
            boundaryId,
            contentSegment,
            slot,
            segmentOptions,
            content.suspended,
            revealBoundary,
            slotReplayRecords
          )
        );
      } else {
        ssr.queueOutOfOrderSegment(
          emitRenderedOutOfOrderSegment(ssr, boundaryId, content, revealBoundary)
        );
      }
    })
  : null!;

async function emitResolvedOutOfOrderSegment(
  ssr: SSRContainer,
  boundaryId: number,
  segmentId: string,
  children: JSXOutput,
  options: SSRRenderJSXOptions,
  firstPromise: Promise<unknown>,
  revealBoundary: OutOfOrderRevealBoundary | null,
  slotReplayRecords: SSRSlotReplayRecords
): Promise<void> {
  await firstPromise;
  const rendered = await ssr.$runQueuedRenderBeforeRootState$(() =>
    ssr.segment(segmentId, children, {
      ...options,
      promiseMode: 'normal',
      slotReplay: {
        mode: 'replay',
        records: slotReplayRecords,
      },
    })
  );
  await emitRenderedOutOfOrderSegment(ssr, boundaryId, rendered, revealBoundary);
}

async function emitRenderedOutOfOrderSegment(
  ssr: SSRContainer,
  boundaryId: number,
  rendered: Awaited<ReturnType<SSRContainer['segment']>>,
  revealBoundary: OutOfOrderRevealBoundary | null
): Promise<void> {
  const scriptFlush = await ssr.$runQueuedRenderBeforeRootState$(async () => {
    writeOutOfOrderResolvedTemplate(ssr, boundaryId, rendered.html, revealBoundary);
    ssr.emitInlineScript(`qO(${boundaryId})`);
    const scriptFlush = ssr.emitOutOfOrderSegmentScripts(rendered.scripts);
    await ssr.streamHandler.flush();
    return scriptFlush;
  });
  await scriptFlush;
}

function shouldRenderFallback(
  fallback: JSXOutput,
  revealBoundary: OutOfOrderRevealBoundary | null
): boolean {
  return (
    fallback != null &&
    fallback !== false &&
    (revealBoundary === null || revealBoundary.showFallback)
  );
}

function writeOutOfOrderPlaceholder(ssr: SSRContainer, boundaryId: number): void {
  ssr.write(`<template ${QSuspenseResolved}="${boundaryId}"></template>`);
}

function writeOutOfOrderResolvedTemplate(
  ssr: SSRContainer,
  boundaryId: number,
  html: string,
  revealBoundary: OutOfOrderRevealBoundary | null
): void {
  ssr.write(`<template ${QSuspenseResolved}="${boundaryId}"${revealBoundary?.attrs ?? ''}>`);
  ssr.write(html);
  ssr.write('</template>');
}
