/**
 * Formats a text string into display-only sentence case while preserving:
 * - Numbers, punctuation, line breaks (\n), and emojis
 * - URLs (http, https, www) and email addresses
 * - Common clinic/medical abbreviations: MRI, OPD, ICU, DNA, Dr., Dr
 *
 * @param {string} text - Raw input string from Firestore or UI
 * @returns {string} Formatted sentence case string
 */
export function toSentenceCase(text) {
  if (typeof text !== "string" || !text.trim()) {
    return text;
  }

  // Regex to match URLs, emails, and medical abbreviations
  const protectedPattern = /\b(?:https?:\/\/|www\.)\S+|\b[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}|\b(?:MRI|OPD|ICU|DNA|Dr)\.?(?=\s|$|\b)/gi;

  const protectedTokens = [];

  // Replace protected items with non-alphabetic placeholders (\uE000<index>\uE001)
  const tokenizedText = text.replace(protectedPattern, (match) => {
    const token = `\uE000${protectedTokens.length}\uE001`;
    let normalized = match;
    const lower = match.toLowerCase();

    if (lower === "mri") normalized = "MRI";
    else if (lower === "opd") normalized = "OPD";
    else if (lower === "icu") normalized = "ICU";
    else if (lower === "dna") normalized = "DNA";
    else if (lower.startsWith("dr")) normalized = match.endsWith(".") ? "Dr." : "Dr";

    protectedTokens.push(normalized);
    return token;
  });

  let isNewSentence = true;
  let result = "";

  for (let i = 0; i < tokenizedText.length; i++) {
    const char = tokenizedText[i];

    // Handle protected token placeholder
    if (char === "\uE000") {
      const endIdx = tokenizedText.indexOf("\uE001", i);
      if (endIdx !== -1) {
        const tokenNum = parseInt(tokenizedText.substring(i + 1, endIdx), 10);
        result += protectedTokens[tokenNum];
        i = endIdx;
        isNewSentence = false;
        continue;
      }
    }

    if (char === "\n" || char === "!" || char === "?") {
      result += char;
      isNewSentence = true;
    } else if (char === ".") {
      result += char;
      isNewSentence = true;
    } else if (/[a-zA-Z]/.test(char)) {
      if (isNewSentence) {
        result += char.toUpperCase();
        isNewSentence = false;
      } else {
        result += char.toLowerCase();
      }
    } else {
      result += char;
    }
  }

  return result;
}

export default toSentenceCase;
