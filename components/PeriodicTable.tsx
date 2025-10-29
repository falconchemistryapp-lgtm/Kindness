import React, { useState, useEffect, useRef } from 'react';
import { PERIODIC_TABLE_ELEMENTS, ELEMENT_COLORS } from '../constants';
import { getElementInsights, getReaction, ElementInsights, Reaction } from '../services/geminiService';
import { Spinner, ErrorDisplay } from './common';
import { ContentRenderer } from './ContentRenderer';

interface PeriodicTableProps {
    resetTrigger: number;
}

const PeriodicTable = ({ resetTrigger }: PeriodicTableProps) => {
    const [selectedElements, setSelectedElements] = useState<(typeof PERIODIC_TABLE_ELEMENTS[0])[]>([]);
    const [insights, setInsights] = useState<(ElementInsights | null)[]>([null, null]);
    const [reaction, setReaction] = useState<Reaction | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [activeInsightTab, setActiveInsightTab] = useState<0 | 1>(0);
    const [zoom, setZoom] = useState(1);
    const isFirstRun = useRef(true);

    const handleReset = () => {
        setSelectedElements([]);
        setInsights([null, null]);
        setReaction(null);
        setError(null);
        setActiveInsightTab(0);
    };

    useEffect(() => {
        if (isFirstRun.current) {
            isFirstRun.current = false;
            return;
        }
        handleReset();
    }, [resetTrigger]);

    const handleElementClick = async (element: typeof PERIODIC_TABLE_ELEMENTS[0]) => {
        if (selectedElements.some(e => e.number === element.number) || selectedElements.length >= 2) {
            return;
        }

        setError(null);
        setReaction(null);

        const newSelection = [...selectedElements, element];
        setSelectedElements(newSelection);
        
        const elementIndex = newSelection.length - 1;
        setActiveInsightTab(elementIndex as 0 | 1);
        setIsLoading(true);
        try {
            const insightsData = await getElementInsights(element.name);
            setInsights(prevInsights => {
                const updatedInsights = [...prevInsights];
                updatedInsights[elementIndex] = insightsData;
                return updatedInsights;
            });
        } catch (e: any) {
            setError(e.message || "Could not fetch element details.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleReactClick = async () => {
        if (selectedElements.length !== 2) return;
        setIsLoading(true);
        setError(null);
        setReaction(null);
        try {
            const reactionData = await getReaction(selectedElements[0].name, selectedElements[1].name);
            setReaction(reactionData);
        } catch (e: any) {
            setError(e.message || "Could not predict the reaction.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleBackgroundClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.target === e.currentTarget) {
            handleReset();
        }
    };

    const mainGridElements = PERIODIC_TABLE_ELEMENTS.filter(el => el.row <= 7);
    const lanthanides = PERIODIC_TABLE_ELEMENTS.filter(el => el.category === 'lanthanide');
    const actinides = PERIODIC_TABLE_ELEMENTS.filter(el => el.category === 'actinide');

    const renderElement = (element: typeof PERIODIC_TABLE_ELEMENTS[0]) => {
        const isSelected = selectedElements.some(e => e.number === element.number);
        const color = ELEMENT_COLORS[element.category] || 'bg-gray-700';
        return (
            <div
                key={element.number}
                className={`p-1 sm:p-2 border border-[var(--border-primary)] cursor-pointer transition-all duration-200 ${color} hover:scale-110 hover:z-10 relative ${isSelected ? 'ring-4 ring-[var(--ring-accent)]' : ''}`}
                style={{ gridRow: element.row, gridColumn: element.col }}
                onClick={(e) => {
                    e.stopPropagation();
                    handleElementClick(element);
                }}
                aria-pressed={isSelected}
                role="button"
                tabIndex={0}
            >
                <div className="text-xs sm:text-sm font-bold">{element.symbol}</div>
                <div className="hidden sm:block text-xs">{element.name}</div>
                <div className="absolute top-0 right-1 text-[0.6rem]">{element.number}</div>
            </div>
        );
    };
    
    const InsightPanelContent = () => {
        const activeInsight = insights[activeInsightTab];
        const activeElement = selectedElements[activeInsightTab];
      
        if (!activeElement) return null;
      
        if (isLoading && !activeInsight) {
          return <Spinner />;
        }
      
        if (!activeInsight) {
          return <div className="text-[var(--text-secondary)] text-center p-4">Select an element to see details.</div>;
        }
      
        return (
          <div className="animate-fade-in text-[var(--text-secondary)]">
            <h3 className="text-xl font-semibold text-[var(--text-info-strong)] mb-2">{activeElement.name}</h3>
            <p className="mb-3 text-sm">{activeInsight.summary}</p>
            <ul className="text-xs space-y-1">
              {/* FIX: Changed from children to 'content' prop to resolve typing error. */}
              <li><strong>Electron Config:</strong> <ContentRenderer content={activeInsight.electronConfiguration} /></li>
              <li><strong>Melting Point:</strong> {activeInsight.meltingPoint}</li>
              <li><strong>Boiling Point:</strong> {activeInsight.boilingPoint}</li>
            </ul>
            <h4 className="font-semibold mt-3 mb-1 text-[var(--text-info)]">Applications:</h4>
            <ul className="list-disc list-inside text-xs space-y-1">
              {activeInsight.applications.map((app, i) => <li key={i}>{app}</li>)}
            </ul>
          </div>
        );
      };

    return (
        <div className="flex flex-col h-full">
            <div>
                <h2 className="text-3xl font-bold text-[var(--text-accent-alt)]">Reaction Playground</h2>
                <p className="text-[var(--text-secondary)] mb-4">Select an element to see its details, or two to see how they react.</p>
            </div>
            <div className="flex flex-col md:flex-row gap-4 flex-grow relative overflow-hidden">
                <div className="flex-grow w-full flex flex-col overflow-hidden">
                    {/* Zoom Controls */}
                    <div className="flex items-center gap-2 mb-2 flex-shrink-0">
                        <span className="text-sm text-[var(--text-secondary)]">Zoom:</span>
                        <button onClick={() => setZoom(z => Math.max(0.5, z - 0.2))} className="w-8 h-8 bg-[var(--bg-tertiary)] hover:bg-[var(--bg-quaternary)] rounded-md transition-colors" aria-label="Zoom out">-</button>
                        <button onClick={() => setZoom(1)} className="text-sm px-3 h-8 bg-[var(--bg-tertiary)] hover:bg-[var(--bg-quaternary)] rounded-md transition-colors">Reset</button>
                        <button onClick={() => setZoom(z => Math.min(2.5, z + 0.2))} className="w-8 h-8 bg-[var(--bg-tertiary)] hover:bg-[var(--bg-quaternary)] rounded-md transition-colors" aria-label="Zoom in">+</button>
                    </div>

                    {/* Zoom Viewport */}
                    <div className="flex-grow w-full overflow-auto">
                        <div 
                            className={`relative transition-all duration-200 ${selectedElements.length > 0 ? 'pb-[45vh]' : 'pb-4'} md:pb-4`}
                            style={{ transform: `scale(${zoom})`, transformOrigin: 'top left' }}
                        >
                            <div className="grid grid-cols-18 gap-1 text-center text-white text-xs min-w-[900px]" onClick={handleBackgroundClick}>
                                {mainGridElements.map(renderElement)}
                            </div>
                            <div className="mt-6">
                                <div className="grid grid-cols-18 gap-1 text-center text-white text-xs min-w-[900px]" onClick={handleBackgroundClick}>
                                    {/* Placeholders for lanthanide/actinide labels */}
                                    <div style={{gridRow: 9, gridColumn: 2}} className="flex items-center justify-center text-[var(--text-secondary)] text-xs">57-71</div>
                                    <div style={{gridRow: 10, gridColumn: 2}} className="flex items-center justify-center text-[var(--text-secondary)] text-xs">89-103</div>
                                    {lanthanides.map(renderElement)}
                                    {actinides.map(renderElement)}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <aside className={`
                    ${selectedElements.length > 0 ? 'translate-y-0' : 'translate-y-full'} md:translate-y-0 
                    transform transition-transform duration-300 ease-in-out 
                    fixed bottom-0 left-0 right-0 h-[45vh] z-40
                    md:h-auto md:sticky md:top-0 md:w-1/3 xl:w-1/4 
                    bg-[var(--bg-secondary)]/80 backdrop-blur-sm md:bg-[var(--bg-secondary-alpha)] 
                    p-4 rounded-t-2xl md:rounded-lg flex flex-col`
                }>
                    <div className="w-12 h-1.5 bg-[var(--bg-quaternary)] rounded-full mx-auto mb-3 md:hidden"></div>
                    
                    {/* --- REACTION CONTROLS --- */}
                    <div className="mb-4">
                        <div className="bg-[var(--bg-primary)] p-2 rounded-lg mb-4 h-16 flex items-center justify-around">
                            <div className="w-1/2 text-center border-r border-[var(--border-primary)]">
                                <div className="text-xs text-[var(--text-secondary)]">Reactant 1</div>
                                <div className="font-bold text-lg">{selectedElements[0]?.symbol || '-'}</div>
                            </div>
                            <div className="w-1/2 text-center">
                                <div className="text-xs text-[var(--text-secondary)]">Reactant 2</div>
                                <div className="font-bold text-lg">{selectedElements[1]?.symbol || '-'}</div>
                            </div>
                        </div>
                        <button 
                            onClick={handleReactClick}
                            disabled={selectedElements.length !== 2 || isLoading}
                            className="w-full bg-[var(--bg-accent)] text-[var(--text-on-accent)] font-bold py-2 px-4 rounded-lg transition-colors hover:bg-[var(--bg-accent-hover)] disabled:bg-[var(--bg-tertiary)] disabled:text-[var(--text-muted)] disabled:cursor-not-allowed"
                        >
                        {isLoading && selectedElements.length === 2 ? 'Analyzing...' : 'React'}
                        </button>
                        <button 
                            onClick={handleReset}
                            className="w-full bg-[var(--bg-quaternary)] text-[var(--text-on-accent)] font-bold py-2 px-4 rounded-lg transition-colors hover:bg-[var(--bg-tertiary)] mt-2"
                        >
                            Reset
                        </button>
                    </div>

                    {/* --- DISPLAY AREA --- */}
                    <div className="flex-grow overflow-y-auto pr-2 border-t border-[var(--border-primary)] pt-4">
                        {error && <ErrorDisplay message={error} onRetry={handleReset} />}
                        
                        {selectedElements.length === 0 && !error && (
                            <div className="text-center text-[var(--text-secondary)] p-8 hidden md:block">
                                <p className="text-lg">Select one element to see its details, or two to see how they react.</p>
                            </div>
                        )}

                        {selectedElements.length > 0 && !error && (
                            <div>
                                {selectedElements.length === 2 && (
                                    <div className="flex border-b border-[var(--border-primary)] mb-3">
                                        <button onClick={() => setActiveInsightTab(0)} className={`flex-1 py-2 text-sm font-semibold truncate ${activeInsightTab === 0 ? 'text-[var(--text-accent)] border-b-2 border-[var(--text-accent)]' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}>
                                            {selectedElements[0].symbol}
                                        </button>
                                        <button onClick={() => setActiveInsightTab(1)} className={`flex-1 py-2 text-sm font-semibold truncate ${activeInsightTab === 1 ? 'text-[var(--text-accent)] border-b-2 border-[var(--text-accent)]' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}>
                                            {selectedElements[1].symbol}
                                        </button>
                                    </div>
                                )}
                                <InsightPanelContent />
                            </div>
                        )}
                        
                        {reaction && !error && (
                            <div className="mt-4 pt-4 border-t border-[var(--border-primary)] animate-fade-in">
                                <h3 className="text-xl font-semibold text-[var(--text-success)] mb-2">Reaction Result</h3>
                                {reaction.reactionPossible ? (
                                    <>
                                        <div 
                                            className="font-mono bg-[var(--bg-primary)] p-3 rounded-md text-center text-lg my-2"
                                        >
                                        {/* FIX: Changed from children to 'content' prop to resolve typing error. */}
                                        <ContentRenderer content={reaction.balancedEquation} />
                                        </div>
                                        <p className="text-sm text-[var(--text-secondary)]">{reaction.explanation}</p>
                                    </>
                                ) : (
                                    <p className="text-sm italic text-[var(--text-secondary)]">{reaction.explanation}</p>
                                )}
                            </div>
                        )}
                    </div>
                </aside>
            </div>
        </div>
    );
};

export default PeriodicTable;