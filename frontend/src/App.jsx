import { useState } from 'react';
import { uploadCsv, fetchRows } from './api';
import './App.css';

const PAGE_SIZE = 50;

function App() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  
  const [rows, setRows] = useState([]);
  const [totalRows, setTotalRows] = useState(0);

  const [searchText, setSearchText] = useState('');
  const [isLoadingRows, setIsLoadingRows] = useState(false);
  const [hasDataset, setHasDataset] = useState(false);

  const [offset, setOffset] = useState(0);

  function handleFileChange(event) {
    const file = event.target.files[0];

    if (file) {
      setSelectedFile(file);
      setMessage('');
      setError('');
    }
  }

  async function loadRows(searchValue = '', newOffset = 0) {
    setIsLoadingRows(true);

    try {
      const rowsData = await fetchRows({
        limit: PAGE_SIZE,
        offset: newOffset,
        search: searchValue,
      });

      setRows(rowsData.rows);
      setTotalRows(rowsData.total);
      setOffset(newOffset);
    } finally {
      setIsLoadingRows(false);
    }
  }

  async function handleUpload() {
    if (!selectedFile) {
      setError('Please choose a CSV file first');
      setMessage('');
      return;
    }

    setIsUploading(true);
    setMessage('');
    setError('');

    try {
      const result = await uploadCsv(selectedFile);
      
      setSearchText('');
      setHasDataset(true);  
      
      await loadRows('', 0);

      setMessage(
        `${result.filename} uploaded successfully. ${result.rows_count} rows loaded.`
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setIsUploading(false);
    }
  }

  async function handleSearch(event) {
    event.preventDefault();

    setMessage('');
    setError('');

    try {
      await loadRows(searchText, 0);
    } catch (err) {
      setError(err.message);
    }
  }

  async function handlePreviousPage() {
    const previousOffset = Math.max(offset - PAGE_SIZE, 0);

    setMessage('');
    setError('');

    try {
      await loadRows(searchText, previousOffset);
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleNextPage() {
    const nextOffset = offset + PAGE_SIZE;

    if (nextOffset >= totalRows) {
      return;
    }

    setMessage('');
    setError('');

    try {
      await loadRows(searchText, nextOffset);
    } catch (err) {
      setError(err.message);
    }
  }

  const currentPage = Math.floor(offset / PAGE_SIZE) + 1;
  const totalPages = Math.max(1, Math.ceil(totalRows / PAGE_SIZE));
  const canGoPrevious = offset > 0;
  const canGoNext = offset + PAGE_SIZE < totalRows;

  return (
    <main className="app-container">
      <h1>AI Data Insights</h1>

      <section className="card">
        <h2>Upload dataset</h2>

        <p>
          Choose a CSV file to load into the application.
        </p>

        <input
          type="file"
          accept=".csv"
          onChange={handleFileChange}
        />

        <button
          type="button"
          onClick={handleUpload}
          disabled={isUploading}
        >
          {isUploading ? 'Uploading...' : 'Upload CSV'}
        </button>

        {selectedFile && (
          <p className="muted">
            Selected file: {selectedFile.name}
          </p>
        )}

        {message && (
          <p className="success-message">
            {message}
          </p>
        )}

        {error && (
          <p className="error-message">
            {error}
          </p>
        )}
      </section>

     
    {hasDataset && (
    <section className="card">
      <h2>Data preview</h2>

      <form onSubmit={handleSearch} className="search-form">
        <input
          type="text"
          placeholder="Search in the dataset..."
          value={searchText}
          onChange={(event) => setSearchText(event.target.value)}
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
                {Object.keys(rows[0]).map((column) => (
                  <th key={column}>{column}</th>
                ))}
              </tr>
            </thead>

            <tbody>
              {rows.map((row, rowIndex) => (
                <tr key={rowIndex}>
                  {Object.values(row).map((value, columnIndex) => (
                    <td key={columnIndex}>{String(value)}</td>
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
        onClick={handlePreviousPage}
        disabled={isLoadingRows || !canGoPrevious}
      >
        Previous
      </button>

      <span>
        Page {currentPage} of {totalPages}
      </span>

      <button
        type="button"
        onClick={handleNextPage}
        disabled={isLoadingRows || !canGoNext}
      >
        Next
      </button>
    </div>
    </section>
  )}
    </main>
  );
}

export default App;