import { addIdxString, removeIdxString } from './cartUtils'

const CART_KEY = '__CART__'

describe('addIdxString', () => {
    it('combines index and product ID with CART_KEY', () => {
        const result = addIdxString(0, 'prod123')
        expect(result).toBe('0' + CART_KEY + 'prod123')
    })

    it('handles numeric index and string product ID', () => {
        const result = addIdxString(5, 'ABC-789')
        expect(result).toBe('5' + CART_KEY + 'ABC-789')
    })

    it('handles string index', () => {
        const result = addIdxString('10', 'prod456')
        expect(result).toBe('10' + CART_KEY + 'prod456')
    })

    it('handles empty string product ID', () => {
        const result = addIdxString(1, '')
        expect(result).toBe('1' + CART_KEY + '')
    })

    it('handles zero index', () => {
        const result = addIdxString(0, 'prod000')
        expect(result).toBe('0' + CART_KEY + 'prod000')
    })

    it('handles negative index', () => {
        const result = addIdxString(-1, 'prod999')
        expect(result).toBe('-1' + CART_KEY + 'prod999')
    })
})

describe('removeIdxString', () => {
    it('extracts product ID from combined string', () => {
        const result = removeIdxString('0' + CART_KEY + 'prod123')
        expect(result).toBe('prod123')
    })

    it('handles multiple indices in combined ID', () => {
        const result = removeIdxString('5' + CART_KEY + 'ABC-789')
        expect(result).toBe('ABC-789')
    })

    it('returns original string if CART_KEY not found', () => {
        const result = removeIdxString('justAString')
        expect(result).toBe('justAString')
    })

    it('returns undefined when input is undefined', () => {
        const result = removeIdxString(undefined)
        expect(result).toBeUndefined()
    })

    it('returns null when input is null', () => {
        const result = removeIdxString(null)
        expect(result).toBeNull()
    })

    it('handles empty string input', () => {
        const result = removeIdxString('')
        expect(result).toBe('')
    })

    it('converts number input to string and process', () => {
        const result = removeIdxString(123)
        expect(result).toBe('123')
    })

    it('handles combined ID ending with CART_KEY (empty product ID)', () => {
        const result = removeIdxString('1' + CART_KEY + '')
        expect(result).toBe('')
    })

    it('handles product ID containing CART_KEY', () => {
        const result = removeIdxString('0' + CART_KEY + 'prod' + CART_KEY + '123')
        expect(result).toBe('prod' + CART_KEY + '123')
    })

    it('handles CART_KEY at the beginning', () => {
        const result = removeIdxString('' + CART_KEY + 'prod456')
        expect(result).toBe('prod456')
    })

    it('handles very long combined strings', () => {
        const longPid = 'a'.repeat(1000)
        const combined = `99${CART_KEY}${longPid}`
        const result = removeIdxString(combined)
        expect(result).toBe(longPid)
    })
})

describe('addIdxString and removeIdxString integration', () => {
    it('is reversible for typical use case', () => {
        const idx = 3
        const pid = 'product-abc-123'
        const combined = addIdxString(idx, pid)
        const extracted = removeIdxString(combined)
        expect(extracted).toBe(pid)
    })

    it('handles round trip with special characters', () => {
        const idx = 0
        const pid = 'prod-@#$%^&*()'
        const combined = addIdxString(idx, pid)
        const extracted = removeIdxString(combined)
        expect(extracted).toBe(pid)
    })

    it('handles round trip with numeric product ID', () => {
        const idx = 7
        const pid = '987654321'
        const combined = addIdxString(idx, pid)
        const extracted = removeIdxString(combined)
        expect(extracted).toBe(pid)
    })
})