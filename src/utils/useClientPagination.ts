import { useEffect, useState } from "react";

export function useClientPagination<T>(items: T[], pageSize = 7) {
  const [page, setPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const paginatedItems = items.slice((page - 1) * pageSize, page * pageSize);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  return {
    page,
    setPage,
    totalPages,
    paginatedItems,
    pageSize,
  };
}
