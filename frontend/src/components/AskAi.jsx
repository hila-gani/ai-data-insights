import { Sparkles, SendHorizontal, Loader2 } from 'lucide-react';

function AskAi({
  question,
  answer,
  isAsking,
  onQuestionChange,
  onAsk,
}) {
  return (
    <section className="flex-1 flex flex-col min-h-0 rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="flex items-center gap-2">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent text-accent-foreground">
          <Sparkles className="h-4 w-4" aria-hidden="true" />
        </span>
        <div>
          <h2 className="text-sm font-semibold tracking-tight text-card-foreground">
            Ask the AI
          </h2>
        </div>
      </div>
      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
        Ask a question about the uploaded dataset.
      </p>

      {/* Chat thread */}
      <div className="mt-4 flex-1 overflow-y-auto space-y-3 pr-1">
        {!answer && !isAsking && (
          <div className="rounded-xl border border-dashed border-border bg-muted/40 px-3 py-6 text-center text-xs text-muted-foreground">
            Your conversation will appear here.
          </div>
        )}

        {isAsking && (
          <div className="flex justify-start">
            <div className="flex items-center gap-2 rounded-2xl rounded-bl-sm bg-muted px-3 py-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              Thinking...
            </div>
          </div>
        )}

        {answer && !isAsking && (
          <div className="flex justify-start">
            <div className="flex max-w-full gap-2.5">
              <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Sparkles className="h-4 w-4" aria-hidden="true" />
              </span>
              <div className="rounded-2xl rounded-tl-sm border border-border bg-muted/60 px-3.5 py-2.5 text-sm leading-relaxed text-card-foreground">
                <p className="whitespace-pre-wrap">{answer}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Composer */}
      <form onSubmit={onAsk} className="mt-4">
        <div className="flex items-end gap-2 rounded-xl border border-input bg-background p-2 transition-colors focus-within:border-primary focus-within:ring-2 focus-within:ring-ring/30">
          <textarea
            rows={2}
            placeholder="For example: What are the main trends in this dataset?"
            value={question}
            onChange={(event) => onQuestionChange(event.target.value)}
            disabled={isAsking}
            className="max-h-40 min-h-0 flex-1 resize-none bg-transparent px-2 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none disabled:opacity-60"
          />
          <button
            type="submit"
            disabled={isAsking}
            aria-label="Send question"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground transition-colors hover:bg-primary/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isAsking ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <SendHorizontal className="h-4 w-4" aria-hidden="true" />
            )}
          </button>
        </div>
      </form>
    </section>
  );
}

export default AskAi;