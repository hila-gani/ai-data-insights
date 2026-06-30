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
    <section className="card">
      <h2>Data preview</h2>

      <form onSubmit={onSearch} className="search-form">
        <input
          type="text"
          placeholder="Search in the dataset..."
          value={searchText}
          onChange={(event) => onSearchTextChange(event.target.value)}
        />

        <button type="submit" disabled={isLoadingRows}>
          {isLoadingRows ? 'Searching...' : 'Search'}
        </button>
      </form>

      <p className="muted">
        {rows.length > 0
          ? `Showing ${offset + 1}-${offset + rows.length} of ${totalRows} rows`
          : `Showing 0 of ${totalRows} rows`}
      </p>

      {rows.length > 0 ? (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                {columns.map((column) => (
                  <th key={column}>{column}</th>
                ))}
              </tr>
            </thead>

            <tbody>
              {rows.map((row, rowIndex) => (
                <tr key={offset + rowIndex}>
                  {columns.map((column) => (
                    <td key={column}>
                      {String(row[column] ?? '')}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p>No rows found.</p>
      )}

      <div className="pagination">
        <button
          type="button"
          onClick={onPreviousPage}
          disabled={isLoadingRows || !canGoPrevious}
        >
          Previous
        </button>

        <span>
          Page {currentPage} of {totalPages}
        </span>

        <button
          type="button"
          onClick={onNextPage}
          disabled={isLoadingRows || !canGoNext}
        >
          Next
        </button>
      </div>
    </section>
  );
}

export default DataPreview;