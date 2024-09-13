export type ShoppingData = {
    categorized_shopping_results?: Array<{ title: string; source?: string; link?: string }>;
    inline_shopping_results?: Array<{ source?: string; link?: string }>;
    shopping_results?: Array<{ source?: string; link?: string }>;
  };
  
  /**
   * Extracts pairs of `source` and `link` as `NAME` and `URL` from the shopping data.
   * @param {ShoppingData} data - The shopping data to search.
   * @returns {Array<{ NAME: string; URL: string }>} - An array of objects where each object contains a `NAME` and `URL`.
   */
  export const extractSerpApiSourceAndLinkPairs = (data: ShoppingData): Array<{ name: string; url: string }> => {
    const pairs: Array<{ name: string; url: string }> = [];
  
    // Helper function to extract pairs from an array of results
    const extractPairsFromResults = (results?: Array<{ source?: string; link?: string }>) => {
      if (results) {
        results.forEach(result => {
          if (result.source && result.link) {
            pairs.push({
              name: result.source.trim(),
              url: result.link.trim(),
            });
          }
        });
      }
    };
  
    // Extract pairs from categorized shopping results
    extractPairsFromResults(data.categorized_shopping_results);
    
    // Extract pairs from inline shopping results
    extractPairsFromResults(data.inline_shopping_results);
    
    // Extract pairs from shopping results
    extractPairsFromResults(data.shopping_results);
  
    return pairs;
  };
  