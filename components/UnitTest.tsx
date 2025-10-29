import { useState, useEffect } from 'react';
import { getUnitTestQuestions, UnitTestData } from '../services/geminiService';
import { Spinner, ErrorDisplay } from './common';
import { ContentRenderer } from './ContentRenderer';

interface UnitTestProps {
    chapter: string;
    standard: string;
    subject: string;
}

const SourceYearTooltip = ({ year }: { year?: string }) => {
    if (!year) return null;
    return (
        <div className="tooltip-container">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-[var(--text-muted)]" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v5a1 1 0 102 0V6zM10 15a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
            </svg>
            <span className="tooltip-text">{year}</span>
        </div>
    );
};


const UnitTest = ({ chapter, standard, subject }: UnitTestProps) => {
    const [testData, setTestData] = useState<UnitTestData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showAnswers, setShowAnswers] = useState(false);

    useEffect(() => {
        setIsLoading(true);
        setError(null);
        setTestData(null);
        setShowAnswers(false);

        getUnitTestQuestions(chapter, standard, subject)
            .then(data => {
                setTestData(data);
            })
            .catch(e => {
                setError(e.message || 'Failed to load the unit test.');
            })
            .finally(() => {
                setIsLoading(false);
            });
    }, [chapter, standard, subject]);

    if (isLoading) {
        return (
            <div className="flex flex-col h-full">
                <h2 className="text-3xl font-bold text-[var(--text-accent-alt)] mb-4">Unit Test: {chapter}</h2>
                <div className="flex-grow flex flex-col justify-center items-center">
                    <Spinner />
                    <p className="text-[var(--text-secondary)] mt-4">Generating a comprehensive test based on past papers... Please wait.</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col h-full">
                <h2 className="text-3xl font-bold text-[var(--text-accent-alt)] mb-4">Unit Test: {chapter}</h2>
                <ErrorDisplay message={error} onRetry={() => window.location.reload()} />
            </div>
        );
    }

    if (!testData) {
        return <p>No test data is available for this chapter.</p>;
    }

    return (
        <div className="flex flex-col h-full">
            <div className="flex-shrink-0 mb-4 flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-bold text-[var(--text-accent-alt)]">Unit Test</h2>
                    <p className="text-[var(--text-secondary)]">A comprehensive test for {chapter} based on previous year papers.</p>
                </div>
                <button
                    onClick={() => setShowAnswers(!showAnswers)}
                    className="bg-[var(--bg-accent)] text-[var(--text-on-accent)] font-bold py-2 px-4 rounded-lg transition-colors hover:bg-[var(--bg-accent-hover)]"
                >
                    {showAnswers ? 'Hide Answers' : 'Show Answers'}
                </button>
            </div>
            
            <div className="flex-grow overflow-y-auto pr-2 space-y-8">
                {/* --- MCQs --- */}
                <section>
                    <h3 className="text-xl font-semibold text-[var(--text-info-strong)] border-b border-[var(--border-primary)] pb-2 mb-4">Multiple Choice Questions</h3>
                    <div className="space-y-4">
                        {testData.mcqs.map((mcq, index) => (
                            <div key={`mcq-${index}`} className="bg-[var(--bg-secondary-alpha)] p-4 rounded-lg">
                                <div className="flex justify-between items-start mb-2">
                                    <p className="font-semibold flex-1 flex items-center">
                                        {index + 1}. <ContentRenderer content={mcq.question} />
                                        <SourceYearTooltip year={mcq.sourceYear} />
                                    </p>
                                </div>
                                <ul className="list-disc list-inside ml-4 space-y-1">
                                    {mcq.options.map((option, optIndex) => <li key={optIndex}><ContentRenderer content={option} /></li>)}
                                </ul>
                                {showAnswers && (
                                    <div className="mt-3 p-3 bg-[var(--bg-success)] border border-[var(--border-success)] rounded-md">
                                        <p className="text-sm font-bold text-[var(--text-success)]">Correct Answer: <ContentRenderer content={mcq.correctAnswer} /></p>
                                        <p className="text-xs mt-1 text-green-300"><ContentRenderer content={mcq.explanation} /></p>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </section>

                {/* --- Fill in the Blanks --- */}
                <section>
                    <h3 className="text-xl font-semibold text-[var(--text-info-strong)] border-b border-[var(--border-primary)] pb-2 mb-4">Fill in the Blanks</h3>
                    <div className="space-y-4">
                         {testData.fillInTheBlanks.map((fib, index) => (
                            <div key={`fib-${index}`} className="bg-[var(--bg-secondary-alpha)] p-4 rounded-lg">
                                <div className="flex justify-between items-start mb-2">
                                    <p className="font-semibold flex-1">{index + 1}. <ContentRenderer content={fib.question} /></p>
                                </div>
                                {showAnswers && (
                                    <div className="mt-2 text-sm text-[var(--text-success)] font-mono p-2 bg-green-900/20 rounded-md">
                                       <strong>Answer:</strong> <ContentRenderer content={fib.answer} />
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </section>

                 {/* --- Short/Long Answer Questions --- */}
                {[
                    { title: 'Two Marks Questions', questions: testData.twoMarksQuestions },
                    { title: 'Three Marks Questions', questions: testData.threeMarksQuestions },
                    { title: 'Five Marks Questions', questions: testData.fiveMarksQuestions },
                ].map((section) => (
                    <section key={section.title}>
                        <h3 className="text-xl font-semibold text-[var(--text-info-strong)] border-b border-[var(--border-primary)] pb-2 mb-4">{section.title}</h3>
                        <div className="space-y-4">
                            {section.questions.map((q, index) => (
                                <div key={`${section.title}-${index}`} className="bg-[var(--bg-secondary-alpha)] p-4 rounded-lg">
                                    <div className="flex justify-between items-start mb-2">
                                        <p className="font-semibold flex-1">{index + 1}. <ContentRenderer content={q.question} /></p>
                                    </div>
                                    {showAnswers && (
                                        <details className="mt-3 text-sm">
                                            <summary className="cursor-pointer text-[var(--text-accent)] hover:underline">View Model Answer</summary>
                                            <div className="prose prose-invert max-w-none mt-2 border-t border-[var(--border-primary)] pt-2 text-justify">
                                                <ContentRenderer content={q.answer} />
                                            </div>
                                        </details>
                                    )}
                                </div>
                            ))}
                        </div>
                    </section>
                ))}
            </div>
        </div>
    );
};

export default UnitTest;