import { Sparkles, SendHorizontal, Loader2 } from 'lucide-react';

function AskAi({
  question,
  aiResponse,
  aiError,
  isLoading,
  inputValue,
  onInputValueChange,
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
      <div className="mt-4 flex-1 overflow-y-auto pr-1">
        {/* Placeholder state */}
        {!question && !isLoading && (
          <div className="rounded-xl border border-dashed border-border bg-muted/40 px-3 py-6 text-center text-xs text-muted-foreground">
            Ask a question below to get AI insights about your dataset.
          </div>
        )}

        {/* Loading state */}
        {isLoading && (
          <div className="flex justify-start">
            <div className="flex items-center gap-2 rounded-2xl rounded-bl-sm bg-muted px-4 py-3.5 text-sm text-muted-foreground w-full">
              <Loader2 className="h-4 w-4 animate-spin text-primary shrink-0" aria-hidden="true" />
              <span>Analyzing dataset and generating SQL...</span>
            </div>
          </div>
        )}

        {/* Single-Query Card */}
        {question && (aiResponse || aiError) && !isLoading && (
          <div className="rounded-xl border border-border bg-card shadow-sm p-4 flex flex-col gap-3">
            {/* Top Section */}
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground block mb-1">
                Your Question:
              </span>
              <p className="text-sm font-semibold text-foreground leading-relaxed">
                {question}
              </p>
            </div>

            {/* Divider */}
            <hr className="border-border/60" />

            {/* Bottom Section */}
            <div className="flex items-start gap-2.5">
              <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
                <Sparkles className="h-4 w-4" aria-hidden="true" />
              </span>
              <div className="flex-1 text-sm leading-relaxed text-card-foreground">
                {aiError ? (
                  <p className="whitespace-pre-wrap text-destructive font-medium">{aiError}</p>
                ) : (
                  <p className="whitespace-pre-wrap">{aiResponse}</p>
                )}
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
            value={inputValue}
            onChange={(event) => onInputValueChange(event.target.value)}
            disabled={isLoading}
            className="max-h-40 min-h-0 flex-1 resize-none bg-transparent px-2 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none disabled:opacity-60"
          />
          <button
            type="submit"
            disabled={isLoading}
            aria-label="Send question"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground transition-colors hover:bg-primary/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoading ? (
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