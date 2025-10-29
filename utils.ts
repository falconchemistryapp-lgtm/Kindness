/**
 * A cleanup function to find and remove duplicated text units from the AI's output.
 * This function safely handles undefined or null inputs.
 * This regex looks for a sequence of characters (.{5,}) that is at least 5 chars long,
 * which is then immediately repeated, possibly with a single space in between (\s?).
 * This is effective at catching duplicated formulas (H₂SO₄H₂SO₄), values (6.67% 6.67%),
 * and even short phrases, without affecting normal text like "bookkeeper".
 * The 'g' flag ensures it replaces all occurrences globally.
 */
export const removeRepetitiveText = (text?: string | null): string => {
    // Safely handle null or undefined inputs.
    if (!text) {
        return '';
    }
    // Return the cleaned text.
    return text.replace(/(.{5,})\s?\1+/g, '$1');
};
