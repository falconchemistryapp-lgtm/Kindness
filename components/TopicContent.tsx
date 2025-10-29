import React, { useState, useEffect, useRef } from 'react';
import { getFullTopicData, MCQ, generateSpeech, FullTopicData } from '../services/geminiService';
import { Spinner, ErrorDisplay } from './common';
import { ContentRenderer } from './ContentRenderer';

// --- AUDIO HELPERS ---
function decode(base64: string) {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
}

async function decodeAudioData(
    data: Uint8Array,
    ctx: AudioContext,
    sampleRate: number,
    numChannels: number,
): Promise<AudioBuffer> {
    const dataInt16 = new Int16Array(data.buffer);
    const frameCount = dataInt16.length / numChannels;
    const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

    for (let channel = 0; channel < numChannels; channel++) {
        const channelData = buffer.getChannelData(channel);
        for (let i = 0; i < frameCount; i++) {
            channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
        }
    }
    return buffer;
}


// --- SUB-COMPONENTS for TopicContent ---

const VisualizationCard = ({ prompt }: { prompt: string }) => {
    const [editedPrompt, setEditedPrompt] = useState(prompt);
    const [geminiButtonText, setGeminiButtonText] = useState("Generate with Gemini");

    const handleSendToWhatsApp = () => {
        // This phone number is for the official Meta AI bot on WhatsApp.
        const metaAiPhoneNumber = '13135550002';
        // Prepend the /imagine command as required by Meta AI for image generation.
        const promptText = `/imagine ${editedPrompt}`;
        const encodedPrompt = encodeURIComponent(promptText);
        const url = `https://wa.me/${metaAiPhoneNumber}?text=${encodedPrompt}`;
        window.open(url, '_blank', 'noopener,noreferrer');
    };
    
    const handleOpenGemini = () => {
        navigator.clipboard.writeText(editedPrompt).then(() => {
            setGeminiButtonText("Prompt Copied! Opening Gemini...");
            const url = `https://gemini.google.com/`;
            window.open(url, '_blank', 'noopener,noreferrer');
            setTimeout(() => setGeminiButtonText("Generate with Gemini"), 3000);
        });
    };

    return (
        <div>
            <h3 className="text-lg font-semibold text-[var(--text-info-strong)] mb-2">Concept Visualization Prompt</h3>
            <p className="italic text-[var(--text-secondary)] mb-4">Edit the prompt below and use it with an AI image generator to create a visual representation of the concept.</p>
            <textarea
                value={editedPrompt}
                onChange={(e) => setEditedPrompt(e.target.value)}
                rows={5}
                className="w-full bg-[var(--bg-primary)] p-4 rounded-lg font-mono text-sm border border-[var(--border-primary)] focus:ring-[var(--ring-accent)] focus:border-[var(--border-accent)]"
            />
            <div className="flex flex-wrap gap-2 mt-4">
                <button onClick={handleOpenGemini} className="bg-[var(--bg-accent)] hover:bg-[var(--bg-accent-hover)] text-[var(--text-on-accent)] font-bold py-2 px-4 rounded-lg transition-colors flex-grow sm:flex-grow-0">
                    {geminiButtonText}
                </button>
                <div className="flex-grow sm:flex-grow-0">
                    <button onClick={handleSendToWhatsApp} className="bg-green-600 hover:bg-green-500 text-white font-bold py-2 px-4 rounded-lg transition-colors w-full">
                        Visualize with Meta AI
                    </button>
                    <p className="text-xs text-center text-[var(--text-muted)] mt-1">Opens Meta AI chat in WhatsApp.</p>
                </div>
            </div>
        </div>
    );
};

const AudioPlayer = ({ script, prefetchedAudio }: { script: string | null, prefetchedAudio: string | null }) => {
    const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);
    const [isLoadingAudio, setIsLoadingAudio] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [selectedVoice, setSelectedVoice] = useState('Kore');
    const [playbackRate, setPlaybackRate] = useState(1);
    
    const audioContextRef = useRef<AudioContext | null>(null);
    const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);
    const animationFrameRef = useRef<number | null>(null);
    const startTimeRef = useRef<number>(0);
    const pauseTimeRef = useRef<number>(0);

    const formatTime = (timeInSeconds: number) => {
        const minutes = Math.floor(timeInSeconds / 60);
        const seconds = Math.floor(timeInSeconds % 60);
        return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    };

    const stopPlayback = () => {
        if (audioSourceRef.current) {
            audioSourceRef.current.onended = null;
            // FIX: The 'stop' method requires an argument in some environments. Calling stop(0) ensures playback stops immediately.
            audioSourceRef.current.stop(0);
            audioSourceRef.current = null;
        }
        if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
        }
        setIsPlaying(false);
    };

    useEffect(() => {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        return () => {
            stopPlayback();
            audioContextRef.current?.close();
        }
    }, []);

    useEffect(() => {
        if (!script) {
            stopPlayback();
            setAudioBuffer(null);
            setError(null);
            setCurrentTime(0);
            setDuration(0);
            pauseTimeRef.current = 0;
            return;
        };

        stopPlayback();
        setCurrentTime(0);
        pauseTimeRef.current = 0;
        setIsLoadingAudio(true);
        setError(null);

        const decodeAndSetBuffer = async (base64: string) => {
            if (audioContextRef.current) {
                const audioBytes = decode(base64);
                const buffer = await decodeAudioData(audioBytes, audioContextRef.current, 24000, 1);
                setAudioBuffer(buffer);
                setDuration(buffer.duration);
            }
        };

        // FAST PATH: Use pre-fetched audio if available for the default voice
        if (selectedVoice === 'Kore' && prefetchedAudio) {
            decodeAndSetBuffer(prefetchedAudio)
                .catch((e: any) => setError(e.message ?? "Failed to decode pre-fetched audio."))
                .finally(() => setIsLoadingAudio(false));
            return; // End of fast path
        }
        
        // SLOW PATH: Generate new audio if voice is different or pre-fetch wasn't available
        generateSpeech(script, selectedVoice)
            .then(base64Audio => decodeAndSetBuffer(base64Audio))
            .catch(e => setError(e.message || "Failed to generate audio."))
            .finally(() => setIsLoadingAudio(false));

    }, [script, selectedVoice, prefetchedAudio]);


    const updateProgress = () => {
        if (audioContextRef.current && isPlaying) {
            const elapsedTime = (audioContextRef.current.currentTime - startTimeRef.current) * playbackRate;
            const newCurrentTime = pauseTimeRef.current + elapsedTime;
            setCurrentTime(newCurrentTime);
            if (newCurrentTime >= duration) {
                handlePlaybackEnd();
            } else {
                animationFrameRef.current = requestAnimationFrame(updateProgress);
            }
        }
    };
    
    const handlePlaybackEnd = () => {
        stopPlayback();
        setCurrentTime(duration);
        pauseTimeRef.current = 0;
    };

    const handlePlayPause = () => {
        if (!audioBuffer || !audioContextRef.current) return;
        
        if (isPlaying) { // Pause
            stopPlayback();
            const elapsedTime = (audioContextRef.current.currentTime - startTimeRef.current) * playbackRate;
            pauseTimeRef.current += elapsedTime;
        } else { // Play
            if (audioContextRef.current.state === 'suspended') {
                audioContextRef.current.resume();
            }
            audioSourceRef.current = audioContextRef.current.createBufferSource();
            audioSourceRef.current.buffer = audioBuffer;
            audioSourceRef.current.playbackRate.value = playbackRate;
            audioSourceRef.current.connect(audioContextRef.current.destination);
            
            if (currentTime >= duration - 0.01) {
                pauseTimeRef.current = 0;
                setCurrentTime(0);
            }
            
            audioSourceRef.current.start(0, pauseTimeRef.current);
            audioSourceRef.current.onended = handlePlaybackEnd;

            startTimeRef.current = audioContextRef.current.currentTime;
            setIsPlaying(true);
            animationFrameRef.current = requestAnimationFrame(updateProgress);
        }
    };

    const handleProgressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!duration || !audioBuffer || !audioContextRef.current) return;
        
        const newTime = parseFloat(e.target.value);
        const wasPlaying = isPlaying;
    
        if (wasPlaying) {
            stopPlayback();
        }
    
        setCurrentTime(newTime);
        pauseTimeRef.current = newTime;
    
        if (wasPlaying) {
            if (audioContextRef.current.state === 'suspended') {
                audioContextRef.current.resume();
            }
            
            const newSource = audioContextRef.current.createBufferSource();
            newSource.buffer = audioBuffer;
            newSource.playbackRate.value = playbackRate;
            newSource.connect(audioContextRef.current.destination);
            newSource.start(0, newTime);
            newSource.onended = handlePlaybackEnd;
            audioSourceRef.current = newSource;
            
            startTimeRef.current = audioContextRef.current.currentTime;
            setIsPlaying(true);
            animationFrameRef.current = requestAnimationFrame(updateProgress);
        }
    };
    
    if (!script) {
        return (
            <div className="bg-[var(--bg-secondary-alpha)] p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-[var(--text-info-strong)] mb-2">Audio Summary</h3>
                <div className="flex items-center space-x-3 text-[var(--text-secondary)]">
                    <Spinner />
                    <span>Loading audio content...</span>
                </div>
            </div>
        );
    }
    
    const isReady = !isLoadingAudio && audioBuffer && !error;

    return (
        <div className="bg-[var(--bg-secondary-alpha)] p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-[var(--text-info-strong)] mb-2">Audio Summary</h3>
            
            {isLoadingAudio && (
                <div className="flex items-center space-x-3 text-[var(--text-secondary)]">
                    <Spinner />
                    <span>Generating audio...</span>
                </div>
            )}
            {error && <ErrorDisplay message={error} />}

            <div className={`transition-opacity duration-500 ${isReady ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
                {/* Player UI */}
                <div className="space-y-3 mt-4">
                    <input
                        type="range"
                        min="0"
                        max={duration || 1}
                        step="0.01"
                        value={currentTime}
                        onChange={handleProgressChange}
                        className="w-full h-2 bg-[var(--bg-tertiary)] rounded-lg appearance-none cursor-pointer accent-[var(--text-accent)]"
                        aria-label="Audio progress"
                    />
                    <div className="flex justify-between text-xs font-mono text-[var(--text-secondary)]">
                        <span>{formatTime(currentTime)}</span>
                        <span>{formatTime(duration)}</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <button onClick={handlePlayPause} className="bg-[var(--bg-accent)] text-[var(--text-on-accent)] rounded-full p-3 shadow-lg hover:bg-[var(--bg-accent-hover)] focus:outline-none focus:ring-2 focus:ring-[var(--ring-accent)] focus:ring-offset-2 focus:ring-offset-[var(--bg-primary)] disabled:bg-[var(--bg-quaternary)]" disabled={!isReady}>
                            {isPlaying ? 
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg> :
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" /></svg>
                            }
                        </button>
                        <div className="flex-grow flex items-center gap-4">
                            <div className="w-full">
                                <label htmlFor="voice-select" className="text-xs text-[var(--text-secondary)]">Voice</label>
                                <select id="voice-select" value={selectedVoice} onChange={e => setSelectedVoice(e.target.value)} className="w-full text-sm bg-[var(--bg-tertiary)] border-[var(--border-primary)] rounded-md p-1 mt-1">
                                    <option value="Kore">Kore</option>
                                    <option value="Puck">Puck</option>
                                    <option value="Zephyr">Zephyr</option>
                                    <option value="Charon">Charon</option>
                                    <option value="Fenrir">Fenrir</option>
                                </select>
                            </div>
                            <div className="w-full">
                                <label htmlFor="speed-select" className="text-xs text-[var(--text-secondary)]">Speed</label>
                                <select id="speed-select" value={playbackRate} onChange={e => setPlaybackRate(Number(e.target.value))} className="w-full text-sm bg-[var(--bg-tertiary)] border-[var(--border-primary)] rounded-md p-1 mt-1">
                                    <option value={0.75}>Slow (0.75x)</option>
                                    <option value={1}>Normal (1x)</option>
                                    <option value={1.25}>Fast (1.25x)</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Script Display */}
                <details className="mt-4 text-sm">
                    <summary className="cursor-pointer text-[var(--text-secondary)] hover:text-[var(--text-primary)]">View Script</summary>
                    <div className="mt-2 p-3 bg-[var(--bg-primary)] rounded-md text-[var(--text-secondary)] max-h-40 overflow-y-auto">
                        <p>{script}</p>
                    </div>
                </details>
            </div>
        </div>
    );
};

const Quiz = ({ mcqs }: { mcqs: MCQ[] }) => {
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({});
    const [showResults, setShowResults] = useState(false);
  
    const handleAnswerSelect = (option: string) => {
      if (showResults) return;
      setSelectedAnswers(prevAnswers => ({
        ...prevAnswers,
        [currentQuestionIndex]: option,
      }));
    };
  
    const handleNext = () => {
      if (currentQuestionIndex < mcqs.length - 1) {
        setCurrentQuestionIndex(currentQuestionIndex + 1);
      }
    };
  
    const handlePrev = () => {
      if (currentQuestionIndex > 0) {
        // FIX: Corrected logic to decrement index for previous question.
        setCurrentQuestionIndex(currentQuestionIndex - 1);
      }
    };

    const handleReset = () => {
        setSelectedAnswers({});
        setCurrentQuestionIndex(0);
        setShowResults(false);
    }
  
    if (showResults) {
        const score = mcqs.reduce((acc, mcq, index) => {
            return selectedAnswers[index] === mcq.correctAnswer ? acc + 1 : acc;
        }, 0);
        const percentage = (score / mcqs.length) * 100;

        return (
            <div className="animate-fade-in">
                <h3 className="text-2xl font-bold text-center text-[var(--text-accent)] mb-4">Quiz Results</h3>
                <p className="text-center text-lg mb-6">You scored {score} out of {mcqs.length} ({percentage.toFixed(0)}%)</p>
                <div className="space-y-4">
                    {mcqs.map((mcq, index) => {
                        const userAnswer = selectedAnswers[index];
                        const isCorrect = userAnswer === mcq.correctAnswer;
                        return (
                            <div key={index} className={`p-4 rounded-lg ${isCorrect ? 'bg-[var(--bg-success)]' : 'bg-[var(--bg-danger)]'}`}>
                                <p className="font-semibold mb-2">{index + 1}. {mcq.question}</p>
                                <p>Your answer: <span className={isCorrect ? 'text-[var(--text-success)]' : 'text-[var(--text-danger)]'}>{userAnswer || "Not answered"}</span></p>
                                {!isCorrect && <p>Correct answer: {mcq.correctAnswer}</p>}
                                <div className="mt-4 text-sm text-[var(--text-secondary)]"><ContentRenderer content={mcqs[index].explanation} /></div>
                            </div>
                        );
                    })}
                </div>
                <div className="text-center mt-6">
                    <button onClick={handleReset} className="bg-[var(--bg-accent)] text-[var(--text-on-accent)] font-bold py-2 px-6 rounded-lg transition-colors hover:bg-[var(--bg-accent-hover)]">
                        Try Again
                    </button>
                </div>
            </div>
        );
    }
  
    const currentQuestion = mcqs[currentQuestionIndex];
    const selectedOption = selectedAnswers[currentQuestionIndex];
  
    return (
      <div className="animate-fade-in">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-[var(--text-info-strong)]">Quiz Time!</h3>
          <span className="text-sm text-[var(--text-secondary)]">Question {currentQuestionIndex + 1} of {mcqs.length}</span>
        </div>
        <p className="text-lg mb-6"><ContentRenderer content={currentQuestion.question} /></p>
        <div className="space-y-3">
          {currentQuestion.options.map((option, index) => {
            const isSelected = selectedOption === option;
            let buttonClass = "bg-[var(--bg-secondary)] hover:bg-[var(--bg-tertiary)]";
            if (isSelected) {
                buttonClass = "bg-[var(--bg-accent-subtle)] border-[var(--border-accent)] ring-2 ring-[var(--ring-accent)]";
            }
            return (
              <button
                key={index}
                onClick={() => handleAnswerSelect(option)}
                className={`w-full text-left p-4 rounded-lg border transition-all duration-200 ${buttonClass}`}
              >
                 <ContentRenderer content={option} />
              </button>
            );
          })}
        </div>
        <div className="flex justify-between mt-6">
          <button onClick={handlePrev} disabled={currentQuestionIndex === 0} className="bg-[var(--bg-quaternary)] text-[var(--text-on-accent)] font-bold py-2 px-4 rounded-lg transition-colors hover:bg-[var(--bg-tertiary)] disabled:opacity-50">
            Previous
          </button>
          {currentQuestionIndex === mcqs.length - 1 ? (
             <button onClick={() => setShowResults(true)} className="bg-[var(--bg-success)] text-green-900 font-bold py-2 px-6 rounded-lg transition-colors hover:opacity-90 disabled:opacity-50" disabled={!selectedOption}>
                Finish & See Results
            </button>
          ) : (
            <button onClick={handleNext} disabled={!selectedOption} className="bg-[var(--bg-accent)] text-[var(--text-on-accent)] font-bold py-2 px-4 rounded-lg transition-colors hover:bg-[var(--bg-accent-hover)] disabled:opacity-50">
                Next
            </button>
          )}
        </div>
      </div>
    );
  };

const ExplanationCard = ({ content }: { content: string }) => (
    <div className="prose prose-invert max-w-none text-justify">
        <ContentRenderer content={content} />
    </div>
);


// --- MAIN COMPONENT ---
  
const TopicContent = ({ topic, chapter, standard, subject }: { topic: string; chapter: string | null; standard: string | null; subject: string | null }) => {
    const [data, setData] = useState<FullTopicData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState('explanation');
  
    useEffect(() => {
      if (!topic || !chapter || !standard || !subject) return;
  
      setIsLoading(true);
      setError(null);
      setData(null);
      setActiveTab('explanation');
  
      getFullTopicData(topic, chapter, standard, subject)
        .then(fetchedData => {
          setData(fetchedData);
        })
        .catch((e: any) => {
          setError(e.message || 'An unknown error occurred.');
        })
        .finally(() => {
          setIsLoading(false);
        });
    }, [topic, chapter, standard, subject]);
  
    if (isLoading) return <Spinner />;
    if (error) return <ErrorDisplay message={error} onRetry={() => { /* re-fetch logic could go here */ }} />;
    if (!data) return <p className="text-center text-[var(--text-secondary)]">No content available for this topic.</p>;
  
    const renderContent = () => {
      switch (activeTab) {
        case 'explanation':
          return <ExplanationCard content={data.explanation} />;
        case 'quiz':
          return <Quiz mcqs={data.mcqs} />;
        case 'visualize':
          return <VisualizationCard prompt={data.visualPrompt} />;
        case 'audio':
           // Pass prefetched audio only for the default voice 'Kore'
           return <AudioPlayer script={data.audioSummaryScript} prefetchedAudio={null} />;
        default:
          return null;
      }
    };

    const tabs = [
        { id: 'explanation', label: 'Explanation' },
        { id: 'quiz', label: 'Quiz' },
        { id: 'visualize', label: 'Visualize' },
        { id: 'audio', label: 'Audio Summary' },
    ];
  
    return (
      <div className="flex flex-col h-full">
        <div className="flex-shrink-0 mb-4">
          <h2 className="text-3xl font-bold text-[var(--text-accent-alt)]">{topic}</h2>
          <div className="border-b border-[var(--border-primary)] mt-4">
            <nav className="flex space-x-4 -mb-px overflow-x-auto">
              {tabs.map(tab => (
                <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm ${
                        activeTab === tab.id
                        ? 'border-[var(--text-accent)] text-[var(--text-accent)]'
                        : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--text-muted)]'
                    }`}
                >
                    {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </div>
  
        <div className="flex-grow overflow-y-auto pr-2">
            {renderContent()}
        </div>
      </div>
    );
};
  
export default TopicContent;