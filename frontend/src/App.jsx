import { useState } from 'react';
import { uploadCsv, fetchRows } from './api';
import './App.css';

function App() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [rows, setRows] = useState([]);
  const [totalRows, setTotalRows] = useState(0);

  function handleFileChange(event) {
    const file = event.target.files[0];

    if (file) {
      setSelectedFile(file);
      setMessage('');
      setError('');
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
      const rowsData = await fetchRows();

      setRows(rowsData.rows);
      setTotalRows(rowsData.total);

      setMessage(
        `${result.filename} uploaded successfully. ${result.rows_count} rows loaded.`
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setIsUploading(false);
    }
  }

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

      {rows.length > 0 && (
      <section className="card">
        <h2>Data preview</h2>

        <p className="muted">
          Showing {rows.length} of {totalRows} rows
        </p>

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
      </section>
    )}
    </main>
  );
}

export default App;