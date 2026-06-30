function UploadDataset({
  selectedFile,
  isUploading,
  onFileChange,
  onUpload,
}) {
  return (
    <section className="card">
      <h2>Upload dataset</h2>

      <p>
        Choose a CSV file to load into the application.
      </p>

      <input
        type="file"
        accept=".csv"
        onChange={onFileChange}
      />

      <button
        type="button"
        onClick={onUpload}
        disabled={isUploading}
      >
        {isUploading ? 'Uploading...' : 'Upload CSV'}
      </button>

      {selectedFile && (
        <p className="muted">
          Selected file: {selectedFile.name}
        </p>
      )}
    </section>
  );
}

export default UploadDataset;