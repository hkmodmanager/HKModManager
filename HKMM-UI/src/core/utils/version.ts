
/**
 * a > b?
 * @param a 
 * @param b 
 */
export function ver_lg(a: string, b: string) {
    const apart = a.split('.');
    const bpart = b.split('.');
    for (let i = 0; i < apart.length; i++) {
        if (i >= bpart.length) return true;
        const va = Number.parseInt(apart[i]);
        const vb = Number.parseInt(bpart[i]);
        if (va > vb) return true;
        else if (va < vb) return false;
    }
    return false;
}
