import { useState, useEffect } from 'react';
import { getNumericalsForChapter, getNumericalSolution, NumericalProblem, NumericalSolution } from '../services/geminiService';
import { Spinner, ErrorDisplay } from './common';
import { ContentRenderer } from './ContentRenderer';

interface NumericalsProps {
    chapter: string;
    standard: string;
    subject: string;
}

const Numericals = ({ chapter, standard, subject }: NumericalsProps) => {
    const [problems, setProblems] = useState<NumericalProblem[]>([]);
    const [selectedProblem, setSelectedProblem] = useState<NumericalProblem | null>(null);
    const [solutions, setSolutions] = useState<NumericalSolution[]>([]);
    const [isLoadingProblems, setIsLoadingProblems] = useState(true);
    const [isLoadingSolution, setIsLoadingSolution] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [activeSolutionTab, setActiveSolutionTab] = useState(0);

    useEffect(() => {
        // Reset state when chapter changes
        setProblems([]);
        setSelectedProblem(null);
        setSolutions([]);
        setError(null);
        setIsLoadingProblems(true);

        getNumericalsForChapter(chapter, standard, subject)
            .then(data => {
                setProblems(data);
            })
            .catch(e => {
                setError(e.message || 'Failed to load numerical problems.');
            })
            .finally(() => {
                setIsLoadingProblems(false);
            });
    }, [chapter, standard, subject]);

    const handleProblemSelect = (problem: NumericalProblem) => {
        setSelectedProblem(problem);
        setSolutions([]);
        setIsLoadingSolution(true);
        setError(null);
        setActiveSolutionTab(0);

        getNumericalSolution(problem.problemStatement, chapter, standard, subject)
            .then(data => {
                setSolutions(data);
            })
            .catch(e => {
                setError(e.message || 'Failed to load the solution.');
            })
            .finally(() => {
                setIsLoadingSolution(false);
            });
    };

    const handleBackToList = () => {
        setSelectedProblem(null);
        setSolutions([]);
        setError(null);
    };

    if (isLoadingProblems) {
        return <div className="flex flex-col h-full"><h2 className="text-3xl font-bold text-[var(--text-accent-alt)] mb-4">Numericals</h2><Spinner /></div>;
    }

    if (error && !selectedProblem) {
        return <div className="flex flex-col h-full"><h2 className="text-3xl font-bold text-[var(--text-accent-alt)] mb-4">Numericals</h2><ErrorDisplay message={error} onRetry={() => window.location.reload()} /></div>;
    }

    if (selectedProblem) {
        return (
            <div className="flex flex-col h-full animate-fade-in">
                <div className="flex-shrink-0 mb-4">
                    <button onClick={handleBackToList} className="text-sm text-[var(--text-accent)] hover:underline mb-4">&larr; Back to Problems</button>
                    <div className="bg-[var(--bg-secondary-alpha)] p-4 rounded-lg">
                        <p className="font-semibold text-[var(--text-secondary)]">Problem:</p>
                        {/* FIX: Changed from children to 'content' prop to resolve typing error. */}
                        <div className="text-[var(--text-primary)]"><ContentRenderer content={selectedProblem.problemStatement} /></div>
                    </div>
                </div>

                <div className="flex-grow overflow-y-auto pr-2">
                    {isLoadingSolution && <Spinner />}
                    {error && <ErrorDisplay message={error} onRetry={() => handleProblemSelect(selectedProblem)} />}
                    {!isLoadingSolution && !error && solutions.length > 0 && (
                        <div>
                            <div className="border-b border-[var(--border-primary)] mb-4">
                                <nav className="flex space-x-4 overflow-x-auto">
                                    {solutions.map((sol, index) => (
                                        <button 
                                            key={index}
                                            onClick={() => setActiveSolutionTab(index)} 
                                            className={`py-2 px-1 border-b-2 flex-shrink-0 ${activeSolutionTab === index ? 'border-[var(--text-accent)] text-[var(--text-accent)]' : 'border-transparent text-[var(--text-secondary)] hover:border-[var(--text-muted)]'}`}
                                        >
                                            {sol.methodName}
                                        </button>
                                    ))}
                                </nav>
                            </div>
                            <div className="prose prose-invert max-w-none text-justify">
                                {/* FIX: Changed from children to 'content' prop to resolve typing error. */}
                                <ContentRenderer content={solutions[activeSolutionTab].steps} />
                                <div className="mt-4 p-3 bg-[var(--bg-success)] border border-[var(--border-success)] rounded-lg not-prose">
                                    <strong className="text-[var(--text-success)]">Final Answer: </strong>
                                    {/* FIX: Changed from children to 'content' prop to resolve typing error. */}
                                    <span className="font-mono"><ContentRenderer content={solutions[activeSolutionTab].finalAnswer} /></span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full">
            <h2 className="text-3xl font-bold text-[var(--text-accent-alt)] mb-2">Numericals</h2>
            <p className="text-[var(--text-secondary)] mb-6">Textbook-style problems for {chapter}.</p>
            <div className="flex-grow overflow-y-auto pr-2 space-y-4">
                {problems.length > 0 ? problems.map((problem, index) => (
                    <button 
                        key={problem.id}
                        onClick={() => handleProblemSelect(problem)}
                        className="w-full text-left p-4 rounded-lg bg-[var(--bg-secondary-alpha)] hover:bg-[var(--bg-tertiary)] transition-colors"
                    >
                        <div className="flex items-start">
                            <span className="font-bold text-[var(--text-accent-alt)] mr-3">{index + 1}.</span>
                            <div className="flex-1">
                                <p className="text-sm font-semibold text-[var(--text-secondary)] mb-1">{problem.topic}</p>
                                {/* FIX: Changed from children to 'content' prop to resolve typing error. */}
                                <div><ContentRenderer content={problem.problemStatement} /></div>
                            </div>
                        </div>
                    </button>
                )) : (
                    <div className="text-center text-[var(--text-muted)] p-8">
                        <p>No numerical problems could be generated for this chapter.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Numericals;