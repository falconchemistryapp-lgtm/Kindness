import React, { useState, useEffect } from 'react';

interface FeedbackModalProps {
    isOpen: boolean;
    onClose: () => void;
}

type SubmissionStatus = 'idle' | 'submitting' | 'success' | 'error';

const FeedbackModal = ({ isOpen, onClose }: FeedbackModalProps) => {
    const [name, setName] = useState('');
    const [contact, setContact] = useState(''); // Optional: email or phone
    const [feedback, setFeedback] = useState('');
    const [status, setStatus] = useState<SubmissionStatus>('idle');
    const [errorMessage, setErrorMessage] = useState('');

    const formspreeEndpoint = "https://formspree.io/f/xpwykpjk";

    useEffect(() => {
        if (isOpen) {
            // Reset form when modal opens
            setName('');
            setContact('');
            setFeedback('');
            setStatus('idle');
            setErrorMessage('');
        }
    }, [isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim() || !feedback.trim()) return;

        setStatus('submitting');
        setErrorMessage('');

        try {
            const response = await fetch(formspreeEndpoint, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json'
                },
                body: JSON.stringify({ name, contact, feedback })
            });

            if (response.ok) {
                setStatus('success');
            } else {
                throw new Error('Submission failed. Please try again.');
            }
        } catch (error) {
            setStatus('error');
            setErrorMessage(error instanceof Error ? error.message : 'An unknown error occurred.');
        }
    };

    if (!isOpen) return null;

    return (
        <div 
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex justify-center items-center animate-fade-in"
            onClick={onClose}
            aria-modal="true"
            role="dialog"
        >
            <div 
                className="bg-[var(--bg-secondary)] rounded-xl shadow-2xl w-[calc(100%-2rem)] max-w-lg p-6 relative"
                onClick={e => e.stopPropagation()} // Prevent closing when clicking inside
            >
                <button onClick={onClose} className="absolute top-4 right-4 text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>

                <h2 className="text-2xl font-bold text-[var(--text-accent)] mb-4">Share Your Feedback</h2>
                
                {status === 'success' ? (
                    <div className="text-center py-8">
                        <h3 className="text-xl font-semibold text-[var(--text-success)] mb-2">Thank You!</h3>
                        <p className="text-[var(--text-secondary)]">Your feedback has been submitted successfully.</p>
                        <button onClick={onClose} className="mt-6 bg-[var(--bg-accent)] text-[var(--text-on-accent)] font-bold py-2 px-6 rounded-lg transition-colors hover:bg-[var(--bg-accent-hover)]">
                            Close
                        </button>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Name</label>
                            <input type="text" id="name" value={name} onChange={e => setName(e.target.value)} required className="w-full bg-[var(--bg-tertiary)] border-[var(--border-primary)] rounded-md p-2" />
                        </div>
                        <div>
                            <label htmlFor="contact" className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Email or Phone (Optional)</label>
                            <input type="text" id="contact" value={contact} onChange={e => setContact(e.target.value)} className="w-full bg-[var(--bg-tertiary)] border-[var(--border-primary)] rounded-md p-2" />
                        </div>
                        <div>
                            <label htmlFor="feedback" className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Feedback</label>
                            <textarea id="feedback" value={feedback} onChange={e => setFeedback(e.target.value)} required rows={4} className="w-full bg-[var(--bg-tertiary)] border-[var(--border-primary)] rounded-md p-2"></textarea>
                        </div>
                        {status === 'error' && (
                            <p className="text-sm text-[var(--text-danger)] text-center">{errorMessage}</p>
                        )}
                        <div className="flex justify-end">
                            <button 
                                type="submit"
                                disabled={status === 'submitting'}
                                className="bg-[var(--bg-accent)] text-[var(--text-on-accent)] font-bold py-2 px-6 rounded-lg transition-colors hover:bg-[var(--bg-accent-hover)] disabled:bg-[var(--bg-tertiary)] disabled:text-[var(--text-muted)]"
                            >
                                {status === 'submitting' ? 'Submitting...' : 'Submit'}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
};

export default FeedbackModal;