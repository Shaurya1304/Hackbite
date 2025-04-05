// Helper functions for the application

/**
 * Get color for a programming language
 * @param {string} language - The programming language
 * @returns {string} - The color code for the language
 */
const getLanguageColor = (language) => {
  if (!language) return '#8257e5';
  
  const colors = {
    'JavaScript': '#f1e05a',
    'TypeScript': '#2b7489',
    'Python': '#3572A5',
    'Java': '#b07219',
    'C#': '#178600',
    'C++': '#f34b7d',
    'PHP': '#4F5D95',
    'Ruby': '#701516',
    'Go': '#00ADD8',
    'HTML': '#e34c26',
    'CSS': '#563d7c',
    'Swift': '#ffac45',
    'Kotlin': '#F18E33',
    'Rust': '#dea584',
    'Dart': '#00B4AB'
  };
  return colors[language] || '#8257e5';
};

module.exports = {
  getLanguageColor
}; 