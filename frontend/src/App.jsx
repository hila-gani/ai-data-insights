import { useState } from 'react';
import { uploadCsv } from './api';
import './App.css';

function App() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isUploading, setIsUploading] = useState(false);

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
    </main>
  );
}

export default App;