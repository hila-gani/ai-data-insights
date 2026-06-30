import { useState } from 'react';
import { uploadCsv, fetchRows, askQuestion } from './api';
import UploadDataset from './components/UploadDataset';
import DataPreview from './components/DataPreview';
import AskAi from './components/AskAi';
import './App.css';

const PAGE_SIZE = 20;

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

  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [isAsking, setIsAsking] = useState(false);

  function handleFileChange(event) {
    const file = event.target.files[0];

    if (file) {
      setSelectedFile(file);
      setMessage('');
      setError('');
      setQuestion('');
      setAnswer('');

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
      setQuestion('');
      setAnswer('');
      
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

  async function handleAsk(event) {
    event.preventDefault();

    const trimmedQuestion = question.trim();

    if (!trimmedQuestion) {
      setError('Please enter a question first');
      setAnswer('');
      return;
    }

    if (!hasDataset) {
      setError('Please upload a dataset first');
      setAnswer('');
      return;
    }

    setIsAsking(true);
    setError('');
    setAnswer('');

    try {
      const result = await askQuestion(trimmedQuestion);
      setAnswer(result.answer ?? JSON.stringify(result, null, 2));
    } catch (err) {
      setError(err.message);
    } finally {
      setIsAsking(false);
    }
  }

  const currentPage = Math.floor(offset / PAGE_SIZE) + 1;
  const totalPages = Math.max(1, Math.ceil(totalRows / PAGE_SIZE));
  const canGoPrevious = offset > 0;
  const canGoNext = offset + PAGE_SIZE < totalRows;

  return (
    <main className="app-container">
      <h1>AI Data Insights</h1>

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

      <UploadDataset
        selectedFile={selectedFile}
        isUploading={isUploading}
        onFileChange={handleFileChange}
        onUpload={handleUpload}
      />

      {hasDataset && (
        <DataPreview
          rows={rows}
          totalRows={totalRows}
          offset={offset}
          searchText={searchText}
          isLoadingRows={isLoadingRows}
          currentPage={currentPage}
          totalPages={totalPages}
          canGoPrevious={canGoPrevious}
          canGoNext={canGoNext}
          onSearchTextChange={setSearchText}
          onSearch={handleSearch}
          onPreviousPage={handlePreviousPage}
          onNextPage={handleNextPage}
        />
      )}

      {hasDataset && (
        <AskAi
          question={question}
          answer={answer}
          isAsking={isAsking}
          onQuestionChange={setQuestion}
          onAsk={handleAsk}
        />
      )}
    </main>
  );
}

export default App;