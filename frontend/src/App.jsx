import { useState } from 'react';
import { uploadCsv, fetchRows, askQuestion } from './api';
import UploadDataset from './components/UploadDataset';
import DataPreview from './components/DataPreview';
import AskAi from './components/AskAi';
import { Sparkles, CheckCircle2, AlertCircle, X } from 'lucide-react';

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
    setQuestion('');

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
    <div className="min-h-screen font-sans">
      {/* Top navigation */}
      <header className="sticky top-0 z-20 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
              <Sparkles className="h-5 w-5" aria-hidden="true" />
            </span>
            <div className="leading-tight">
              <h1 className="text-base font-semibold tracking-tight text-foreground">
                AI Data Insights
              </h1>
              <p className="text-xs text-muted-foreground">
                Explore your data with AI
              </p>
            </div>
          </div>

          {hasDataset && (
            <span className="hidden items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground sm:inline-flex">
              <span className="h-1.5 w-1.5 rounded-full bg-success" aria-hidden="true" />
              {totalRows.toLocaleString()} rows loaded
            </span>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Status banners */}
        {message && (
          <div className="mb-4 flex items-start gap-3 rounded-xl border border-success/30 bg-success/10 px-4 py-3 text-sm text-foreground">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" aria-hidden="true" />
            <p className="flex-1">{message}</p>
            <button
              type="button"
              onClick={() => setMessage('')}
              className="text-muted-foreground transition-colors hover:text-foreground"
              aria-label="Dismiss message"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {error && (
          <div className="mb-4 flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-foreground">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" aria-hidden="true" />
            <p className="flex-1">{error}</p>
            <button
              type="button"
              onClick={() => setError('')}
              className="text-muted-foreground transition-colors hover:text-foreground"
              aria-label="Dismiss error"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {!hasDataset ? (
          /* Empty state: centered upload */
          <div className="mx-auto mt-8 max-w-xl">
            <div className="mb-6 text-center">
              <h2 className="text-balance text-2xl font-semibold tracking-tight text-foreground">
                Upload a dataset to get started
              </h2>
              <p className="mt-2 text-pretty text-sm leading-relaxed text-muted-foreground">
                Drop in a CSV file to preview your data and start asking the AI
                questions about it.
              </p>
            </div>
            <UploadDataset
              selectedFile={selectedFile}
              isUploading={isUploading}
              onFileChange={handleFileChange}
              onUpload={handleUpload}
            />
          </div>
        ) : (
          /* Two-column dashboard layout */
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[360px_minmax(0,1fr)]">
            {/* Left sidebar */}
            <aside className="flex flex-col gap-6 lg:sticky lg:top-24 lg:self-start">
              <UploadDataset
                selectedFile={selectedFile}
                isUploading={isUploading}
                onFileChange={handleFileChange}
                onUpload={handleUpload}
              />

              <AskAi
                question={question}
                answer={answer}
                isAsking={isAsking}
                onQuestionChange={setQuestion}
                onAsk={handleAsk}
              />
            </aside>

            {/* Right main content */}
            <div className="min-w-0">
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
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;