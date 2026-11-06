/** Read every page without silently truncating large albums/lists. */
export async function fetchAll<T>(readPage: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: unknown }>): Promise<T[]> {
  const result: T[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await readPage(from, from + 999);
    if (error) throw error;
    result.push(...(data ?? []));
    if (!data || data.length < 1000) return result;
  }
}