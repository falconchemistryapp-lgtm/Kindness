export const Spinner = () => (
    <div className="flex justify-center items-center h-full">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--text-accent)]"></div>
    </div>
);
  
export const ErrorDisplay = ({ message, onRetry }: { message: string, onRetry?: () => void }) => (
      <div className="bg-[var(--bg-danger)] border border-[var(--border-danger)] text-[var(--text-danger)] px-4 py-3 rounded-lg text-center">
        <p className="font-bold">An Error Occurred</p>
        <p className="text-sm">{message}</p>
        {onRetry && (
          <button onClick={onRetry} className="mt-4 bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg transition-colors">
            Retry
          </button>
        )}
      </div>
);
  
export const Footer = ({ onShareFeedbackClick }: { onShareFeedbackClick: () => void }) => (
      <footer className="flex-shrink-0 border-t border-[var(--border-primary)] bg-[var(--bg-secondary-alpha)] px-4 py-2 text-center text-xs text-[var(--text-muted)]">
          <p>Development by Syed Mohammed Idris, Adbul Jameel and Saood.</p>
          <div className="flex justify-center items-center gap-3 mt-1">
            <p>&copy; {new Date().getFullYear()} CO/Chemistry. All Rights Reserved.</p>
            <span className="text-[var(--text-secondary)]">|</span>
            <button onClick={onShareFeedbackClick} className="hover:text-[var(--text-accent)] transition-colors">
              Share Feedback
            </button>
          </div>
      </footer>
);