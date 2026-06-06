"use client";

import { useSyncExternalStore } from "react";

const subscribe = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

export function ClientOnly({ children }: { children: React.ReactNode }) {
  const hasMounted = useSyncExternalStore(subscribe, getClientSnapshot, getServerSnapshot);

  if (!hasMounted) {
    return null;
  }

  return <>{children}</>;
}
