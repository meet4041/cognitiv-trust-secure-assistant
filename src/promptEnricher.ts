export function enrichPrompt(original: string): string {
    let enriched = original;
    if (!original.toLowerCase().includes('validate input')) {
        enriched += '\n// Ensure to validate all user inputs for security.';
    }
    if (!original.toLowerCase().includes('auth')) {
        enriched += '\n// Include proper authentication & authorization checks.';
    }
    return enriched;
}
