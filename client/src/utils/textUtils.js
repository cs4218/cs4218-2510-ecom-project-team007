// Removes leading/trailing whitespace and collapses consecutive spaces
// into a single space.
export const normalizeText = (text) => {
  return text?.trim().replace(/\s+/g, ' ') ?? '';
};
