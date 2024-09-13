type Item = { name: string; url: string };

/**
 * Outputs each name and URL pair as a string on separate lines.
 * @param {Array<Item>} data - An array of objects containing `name` and `url`.
 * @returns {string} - A string with each name and URL on a new line.
 */
export const formattedList = (data: Array<Item>): string => {
  return data.map(item => `
    <div style="margin-bottom: 8px;">
      ${item.name}: <a href="${item.url}" target="_blank" rel="noopener noreferrer" style="color: blue;">${item.url}</a>
    </div>
  `).join('');
};