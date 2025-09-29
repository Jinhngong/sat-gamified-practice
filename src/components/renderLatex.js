// renderLatex.js

// Converts LaTeX-style math text into simplified readable text
const renderLatex = (text) => {
  if (!text || typeof text !== 'string') return text;

  return text
    // Fractions
    .replace(/\\frac{([^}]+)}{([^}]+)}/g, '($1)/($2)')
    // Square roots
    .replace(/\\sqrt{([^}]+)}/g, '√($1)')
    // Superscripts
    .replace(/\^{([^}]+)}/g, '^($1)')
    .replace(/\^([a-zA-Z0-9])/g, '^$1')
    // Subscripts
    .replace(/_{([^}]+)}/g, '_($1)')
    .replace(/_([a-zA-Z0-9])/g, '_$1')
    // Greek letters
    .replace(/\\alpha/g, 'α')
    .replace(/\\beta/g, 'β')
    .replace(/\\gamma/g, 'γ')
    .replace(/\\delta/g, 'δ')
    .replace(/\\theta/g, 'θ')
    .replace(/\\pi/g, 'π')
    .replace(/\\sigma/g, 'σ')
    // Math symbols
    .replace(/\\cdot/g, '·')
    .replace(/\\times/g, '×')
    .replace(/\\div/g, '÷')
    .replace(/\\pm/g, '±')
    .replace(/\\leq/g, '≤')
    .replace(/\\geq/g, '≥')
    .replace(/\\neq/g, '≠')
    .replace(/\\approx/g, '≈')
    .replace(/\\infty/g, '∞')
    // Remove remaining LaTeX commands
    .replace(/\\[a-zA-Z]+{([^}]*)}/g, '$1')
    .replace(/\\[a-zA-Z]+/g, '')
    // Clean up extra spaces
    .replace(/\s+/g, ' ')
    .trim();
};

export default renderLatex;