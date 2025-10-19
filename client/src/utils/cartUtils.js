const CART_KEY = '__CART__'

export const addIdxString = (idx, pid) => {
    return idx + CART_KEY + pid
}

export const removeIdxString = (combinedId) => {
    if (!combinedId) return combinedId
    combinedId = combinedId + ''
    const index = combinedId.indexOf(CART_KEY)
    if (index === -1) return combinedId
    return combinedId.substring(index + CART_KEY.length)
}