import { useRef, useState } from 'react';
import { UploadCloud, FileSpreadsheet, Loader2 } from 'lucide-react';

function UploadDataset({
  selectedFile,
  isUploading,
  onFileChange,
  onUpload,
}) {
  const inputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);

  function handleDrop(event) {
    event.preventDefault();
    setIsDragging(false);

    const files = event.dataTransfer.files;

    if (files && files.length > 0) {
      // Keep the same event shape the parent handler expects.
      onFileChange({ target: { files } });
    }
  }

  return (
    <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <h2 className="text-sm font-semibold tracking-tight text-card-foreground">
        Upload dataset
      </h2>
      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
        Choose a CSV file to load into the application.
      </p>

      <label
        htmlFor="csv-upload"
        onDragOver={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`mt-4 flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-4 py-8 text-center transition-colors ${
          isDragging
            ? 'border-primary bg-accent'
            : 'border-border bg-muted/40 hover:border-primary/60 hover:bg-accent/60'
        }`}
      >
        <span
          className={`mb-3 flex h-11 w-11 items-center justify-center rounded-full transition-colors ${
            isDragging ? 'bg-primary text-primary-foreground' : 'bg-card text-primary'
          }`}
        >
          <UploadCloud className="h-5 w-5" aria-hidden="true" />
        </span>
        <span className="text-sm font-medium text-card-foreground">
          Drop your CSV here
        </span>
        <span className="mt-1 text-xs text-muted-foreground">
          or <span className="font-medium text-primary">browse files</span>
        </span>

        <input
          id="csv-upload"
          ref={inputRef}
          type="file"
          accept=".csv"
          onChange={onFileChange}
          className="sr-only"
        />
      </label>

      {selectedFile && (
        <div className="mt-3 flex items-center gap-3 rounded-lg border border-border bg-muted/50 px-3 py-2">
          <FileSpreadsheet className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
          <span className="min-w-0 flex-1 truncate text-xs font-medium text-card-foreground">
            {selectedFile.name}
          </span>
        </div>
      )}

      <button
        type="button"
        onClick={onUpload}
        disabled={isUploading}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isUploading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            Uploading...
          </>
        ) : (
          'Upload CSV'
        )}
      </button>
    </section>
  );
}

export default UploadDataset;
