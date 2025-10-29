import React from 'react';

interface ContentRendererProps {
    content?: string | null;
}

// Simplified renderer that handles markdown bold (**...**) and newlines.
export const ContentRenderer = ({ content }: ContentRendererProps) => {
    if (!content) return null;

    // Regex to find Markdown bold (**...**)
    const regex = /(\*\*.*?\*\*)/g;
    const parts = content.split(regex);

    return (
        <>
            {parts.map((part, index) => {
                if (part.startsWith('**') && part.endsWith('**')) {
                    // Markdown bold
                    return <strong key={index}>{part.slice(2, -2)}</strong>;
                }
                
                // Plain text segment: handle newlines
                return (
                    <span key={index}>
                        {part.split('\n').map((line, i, arr) => (
                            <React.Fragment key={i}>
                                {line}
                                {i < arr.length - 1 && <br />}
                            </React.Fragment>
                        ))}
                    </span>
                );
            })}
        </>
    );
};