function AskAi({
  question,
  answer,
  isAsking,
  onQuestionChange,
  onAsk,
}) {
  return (
    <section className="card">
      <h2>Ask the AI</h2>

      <p className="muted">
        Ask a question about the uploaded dataset.
      </p>

      <form onSubmit={onAsk} className="ask-form">
        <textarea
          placeholder="For example: What are the main trends in this dataset?"
          value={question}
          onChange={(event) => onQuestionChange(event.target.value)}
          disabled={isAsking}
        />

        <button type="submit" disabled={isAsking}>
          {isAsking ? 'Thinking...' : 'Ask'}
        </button>
      </form>

      {answer && (
        <div className="answer-box">
          <h3>Answer</h3>
          <p style={{ whiteSpace: 'pre-wrap' }}>{answer}</p>
        </div>
      )}
    </section>
  );
}

export default AskAi;