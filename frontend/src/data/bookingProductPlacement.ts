/**
 * Products / unique items are not time-slot based the way services are.
 * When a person's services span multiple chronological time-blocks (Section 2.9),
 * purchased products attach to the earliest block that person appears in.
 */

export function earliestStartAmong(
  items: ReadonlyArray<{ startTime?: string | null }>,
): string | undefined {
  const times = items
    .map((item) => item.startTime?.trim())
    .filter((time): time is string => Boolean(time))
    .sort((a, b) => a.localeCompare(b));
  return times[0];
}

export function stampProductsToEarliestBlock<
  T extends {
    attachedStartTime?: string;
    guestId?: string | null;
  },
>(
  products: readonly T[],
  services: ReadonlyArray<{ startTime?: string | null }>,
  guestId: string | null = null,
): T[] {
  const attachedStartTime = earliestStartAmong(services);
  return products.map((product) => ({
    ...product,
    ...(attachedStartTime ? { attachedStartTime } : { attachedStartTime: undefined }),
    guestId,
  }));
}
