import React, { useState } from 'react';
import { predictReactionDetails, ReactionPrediction } from '../services/geminiService';
import { Spinner, ErrorDisplay } from './common';
import { ContentRenderer } from './ContentRenderer';

const ResultDisplay = ({ prediction }: { prediction: ReactionPrediction }) => (
    <div className="animate-fade-in">
        <h3 className="text-xl font-semibold text-[var(--text-success)] mb-2">Prediction Result</h3>
        <div 
            className="font-mono bg-[var(--bg-primary)] p-3 rounded-md text-center text-lg my-2"
        >
          {/* FIX: Changed from children to 'content' prop to resolve typing error. */}
          <ContentRenderer content={prediction.balancedEquation} />
        </div>
        <div className="mt-4">
            <strong className="text-[var(--text-secondary)]">Reaction Type:</strong>
            <span className="ml-2 bg-[var(--bg-accent-subtle)] text-[var(--text-accent-alt)] text-sm font-medium me-2 px-2.5 py-0.5 rounded-full">{prediction.reactionType}</span>
        </div>
        <p className="text-sm text-[var(--text-secondary)] mt-2">{prediction.explanation}</p>
    </div>
);

const ReactionPredictor = () => {
    const [reactants, setReactants] = useState('');
    const [isChallengeMode, setIsChallengeMode] = useState(false);
    const [prediction, setPrediction] = useState<ReactionPrediction | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showHint, setShowHint] = useState(false);

    const handleSubmit = async (e?: React.FormEvent) => {
        if (e) {
            e.preventDefault();
        }
        if (!reactants.trim()) return;

        setIsLoading(true);
        setError(null);
        setPrediction(null);
        setShowHint(false);

        try {
            const result = await predictReactionDetails(reactants, isChallengeMode);
            setPrediction(result);
        } catch (e: any) {
            setError(e.message || "Failed to predict reaction.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-full">
             <h2 className="text-3xl font-bold text-[var(--text-accent-alt)] mt-2">Reaction Predictor</h2>
             <p className="text-[var(--text-secondary)] mb-6">Enter reactants to predict the balanced equation and reaction type.</p>

             <div className="bg-[var(--bg-secondary-alpha)] p-4 rounded-lg">
                <form onSubmit={handleSubmit}>
                    <label htmlFor="reactants-input" className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Reactants</label>
                    <input 
                        id="reactants-input"
                        type="text"
                        value={reactants}
                        onChange={(e) => setReactants(e.target.value)}
                        placeholder="e.g., HCl + NaOH"
                        className="w-full bg-[var(--bg-tertiary)] border-[var(--border-primary)] rounded-md p-2 mb-4"
                    />
                    <div className="flex justify-between items-center mb-4">
                        <div className="flex items-center">
                            <input 
                                type="checkbox"
                                id="challenge-mode"
                                checked={isChallengeMode}
                                onChange={(e) => setIsChallengeMode(e.target.checked)}
                                className="h-4 w-4 rounded bg-[var(--bg-tertiary)] border-[var(--border-primary)] text-[var(--text-accent)] focus:ring-[var(--ring-accent)]"
                            />
                            <label htmlFor="challenge-mode" className="ml-2 text-sm text-[var(--text-secondary)]">Challenge Mode (Get Hints)</label>
                        </div>
                        <button 
                            type="submit"
                            disabled={isLoading || !reactants.trim()}
                            className="bg-[var(--bg-accent)] text-[var(--text-on-accent)] font-bold py-2 px-4 rounded-lg transition-colors hover:bg-[var(--bg-accent-hover)] disabled:bg-[var(--bg-tertiary)] disabled:text-[var(--text-muted)] disabled:cursor-not-allowed"
                        >
                            {isLoading ? 'Predicting...' : 'Predict Reaction'}
                        </button>
                    </div>
                </form>

                <div className="mt-6 min-h-[150px]">
                    {isLoading && <Spinner />}
                    {error && <ErrorDisplay message={error} onRetry={() => handleSubmit()} />}
                    {prediction && (
                        <div className="animate-fade-in">
                            {isChallengeMode && prediction.hint ? (
                                <>
                                    <h3 className="text-xl font-semibold text-[var(--text-info-strong)] mb-2">Challenge Hint</h3>
                                    <p className="italic text-[var(--text-secondary)] mb-4">{prediction.hint}</p>
                                    {!showHint && (
                                        <button 
                                            onClick={() => setShowHint(true)} 
                                            className="text-sm text-[var(--text-accent)] hover:underline"
                                        >
                                            Stuck? Show Answer
                                        </button>
                                    )}
                                    {showHint && <ResultDisplay prediction={prediction} />}
                                </>
                            ) : (
                                <ResultDisplay prediction={prediction} />
                            )}
                        </div>
                    )}
                </div>
             </div>
        </div>
    );
};

export default ReactionPredictor;