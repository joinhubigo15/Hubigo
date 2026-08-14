/**
 * Runs `worker` over `items` with at most `concurrency` in flight at once. Unlike chunked
 * batching, a finished slot immediately picks up the next item instead of waiting for the
 * whole batch — keeps throughput steady and progress updates smooth.
 */
export async function asyncPool<T>(
  items: T[],
  concurrency: number,
  worker: (item: T, index: number) => Promise<void>,
): Promise<void> {
  let cursor = 0;

  async function runOne(): Promise<void> {
    while (cursor < items.length) {
      const index = cursor++;
      await worker(items[index], index);
    }
  }

  const workers = Array.from({ length: Math.min(concurrency, items.length) }, () => runOne());
  await Promise.all(workers);
}
