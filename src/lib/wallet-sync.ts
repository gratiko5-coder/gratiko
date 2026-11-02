"use client";

export const WALLET_SYNC_EVENT = "gratiko:wallet_sync";

export function triggerWalletSync(balanceCents?: number) {
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent(WALLET_SYNC_EVENT, {
        detail: { balanceCents },
      })
    );
  }
}

export function subscribeWalletSync(callback: (balanceCents?: number) => void) {
  if (typeof window === "undefined") return () => {};

  const handler = (event: Event) => {
    const customEvent = event as CustomEvent<{ balanceCents?: number }>;
    callback(customEvent.detail?.balanceCents);
  };

  window.addEventListener(WALLET_SYNC_EVENT, handler);
  return () => {
    window.removeEventListener(WALLET_SYNC_EVENT, handler);
  };
}
