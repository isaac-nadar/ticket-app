import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useCallback } from "react";

export function useBoardFilters() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  // Get current filter values
  const filters = {
    assignee: searchParams.get("assignee"),
    priority: searchParams.get("priority"),
    date: searchParams.get("date"),
    created: searchParams.get("created"),
    tag: searchParams.get("tag"),
  };

  // Update URL seamlessly
  const setFilter = useCallback(
    (key: string, value: string | null) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      router.push(`${pathname}?${params.toString()}`);
    },
    [searchParams, pathname, router],
  );

  const clearFilters = () => router.push(pathname);

  return { filters, setFilter, clearFilters };
}
