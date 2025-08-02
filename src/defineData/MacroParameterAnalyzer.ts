/**
 * Analyzes macro content to automatically detect parameters from mp.variable and %variable patterns
 */
export class MacroParameterAnalyzer {
  private static readonly MP_VARIABLE_REGEX = /mp\.([a-zA-Z_][a-zA-Z0-9_]*)/g;
  private static readonly PERCENT_VARIABLE_REGEX = /%([a-zA-Z_][a-zA-Z0-9_]*)/g;
  
  /**
   * Analyzes macro content and extracts parameter names
   * @param macroContent The content between [macro] and [endmacro] tags
   * @returns Array of unique parameter names found in the macro
   */
  public static analyzeParameters(macroContent: string): string[] {
    const parameters = new Set<string>();
    
    // Extract mp.variable parameters
    const mpMatches = macroContent.matchAll(this.MP_VARIABLE_REGEX);
    for (const match of mpMatches) {
      const paramName = match[1];
      if (this.isValidParameterName(paramName)) {
        parameters.add(paramName);
      }
    }
    
    // Extract %variable parameters
    const percentMatches = macroContent.matchAll(this.PERCENT_VARIABLE_REGEX);
    for (const match of percentMatches) {
      const paramName = match[1];
      if (this.isValidParameterName(paramName)) {
        parameters.add(paramName);
      }
    }
    
    return Array.from(parameters).sort();
  }
  
  /**
   * Validates if a parameter name is valid (doesn't start with a number)
   * @param paramName The parameter name to validate
   * @returns true if valid, false otherwise
   */
  private static isValidParameterName(paramName: string): boolean {
    return paramName.length > 0 && !/^[0-9]/.test(paramName);
  }
  
  /**
   * Extracts the full content between [macro] and [endmacro] tags
   * @param fileContent The full file content
   * @param macroName The name of the macro to extract
   * @returns The macro content or empty string if not found
   */
  public static extractMacroContent(fileContent: string, macroName: string): string {
    // Create regex to match the specific macro block
    const macroStartPattern = new RegExp(
      `\\[macro\\s+name\\s*=\\s*["']?${macroName}["']?[^\\]]*\\]`,
      'i'
    );
    const endMacroPattern = /\[endmacro\]/i;
    
    const startMatch = fileContent.match(macroStartPattern);
    if (!startMatch) {
      return '';
    }
    
    const startIndex = startMatch.index! + startMatch[0].length;
    const remainingContent = fileContent.substring(startIndex);
    
    const endMatch = remainingContent.match(endMacroPattern);
    if (!endMatch) {
      return '';
    }
    
    return remainingContent.substring(0, endMatch.index!);
  }
}