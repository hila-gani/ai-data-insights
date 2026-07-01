import { Search, ChevronLeft, ChevronRight, Loader2, Table2 } from 'lucide-react';

function DataPreview({
  rows,
  totalRows,
  offset,
  searchText,
  isLoadingRows,
  currentPage,
  totalPages,
  canGoPrevious,
  canGoNext,
  onSearchTextChange,
  onSearch,
  onPreviousPage,
  onNextPage,
}) {
  const columns = rows.length > 0 ? Object.keys(rows[0]) : [];

  return (
    <section className="flex-1 flex flex-col min-h-0 overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      {/* Header */}
      <div className="flex flex-col gap-4 border-b border-border p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent text-accent-foreground">
            <Table2 className="h-4 w-4" aria-hidden="true" />
          </span>
          <div>
            <h2 className="text-sm font-semibold tracking-tight text-card-foreground">
              Data preview
            </h2>
            <p className="text-xs text-muted-foreground">
              {rows.length > 0
                ? `Showing ${offset + 1}-${offset + rows.length} of ${totalRows} rows`
                : `Showing 0 of ${totalRows} rows`}
            </p>
          </div>
        </div>

        <form onSubmit={onSearch} className="flex items-center gap-2">
          <div className="relative flex-1 sm:w-64">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <input
              type="text"
              placeholder="Search in the dataset..."
              value={searchText}
              onChange={(event) => onSearchTextChange(event.target.value)}
              className="w-full rounded-lg border border-input bg-background py-2 pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/30"
            />
          </div>
          <button
            type="submit"
            disabled={isLoadingRows}
            className="flex items-center justify-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoadingRows ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              'Search'
            )}
          </button>
        </form>
      </div>

      {/* Table */}
      {rows.length > 0 ? (
        <div className="overflow-y-auto flex-1">
          <table className="w-full border-collapse text-left text-sm">
            <thead className="sticky top-0 bg-muted/70 backdrop-blur">
              <tr>
                {columns.map((column) => (
                  <th
                    key={column}
                    className="whitespace-nowrap border-b border-border px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                  >
                    {column}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {rows.map((row, rowIndex) => (
                <tr
                  key={offset + rowIndex}
                  className="border-b border-border/60 transition-colors odd:bg-card even:bg-muted/40 hover:bg-accent/50"
                >
                  {columns.map((column) => (
                    <td
                      key={column}
                      className="max-w-35 truncate whitespace-nowrap px-4 py-2.5 text-card-foreground hover:whitespace-normal hover:max-h-none"
                    >
                      {String(row[column] ?? '')}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center gap-2 px-6 py-16 text-center">
          <Table2 className="h-8 w-8 text-muted-foreground/50" aria-hidden="true" />
          <p className="text-sm font-medium text-card-foreground">No rows found</p>
          <p className="text-xs text-muted-foreground">
            Try adjusting your search query.
          </p>
        </div>
      )}

      {/* Pagination */}
      <div className="flex items-center justify-between gap-3 border-t border-border p-4">
        <button
          type="button"
          onClick={onPreviousPage}
          disabled={isLoadingRows || !canGoPrevious}
          className="flex items-center gap-1 rounded-full border border-border bg-card px-3.5 py-1.5 text-sm font-medium text-card-foreground transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          Previous
        </button>

        <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
          Page {currentPage} of {totalPages}
        </span>

        <button
          type="button"
          onClick={onNextPage}
          disabled={isLoadingRows || !canGoNext}
          className="flex items-center gap-1 rounded-full border border-border bg-card px-3.5 py-1.5 text-sm font-medium text-card-foreground transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-40"
        >
          Next
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </section>
  );
}

export default DataPreview;