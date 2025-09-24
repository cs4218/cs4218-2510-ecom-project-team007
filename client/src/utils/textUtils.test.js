import { normalizeText } from './textUtils';

describe('normalizeText', () => {
  it('removes leading and trailing whitespace', () => {
    expect(normalizeText('  Electronics  ')).toBe('Electronics');
  });

  it('collapses consecutive spaces into a single space', () => {
    expect(normalizeText('Electronics    &    Gadgets')).toBe('Electronics & Gadgets');
  });

  it('handles mixed whitespace characters', () => {
    expect(normalizeText('Electronics\t\t&\n\nGadgets')).toBe('Electronics & Gadgets');
  });

  it.each([
    ['empty', ''],
    ['null', null],
    ['undefined', undefined],
  ])('returns an empty string when input is %s', (description, input) => {
    expect(normalizeText(input)).toBe('');
  });

  it('preserves already normalized text', () => {
    expect(normalizeText('Electronics & Gadgets')).toBe('Electronics & Gadgets');
  });
});
