// Centralized API base configuration
(function(){
  try {
    var isLocal = (location && (location.hostname === 'localhost' || location.hostname === '127.0.0.1'));
    // Prefer local proxy '/api' in dev; use Render URL in production
    window.API_BASE = isLocal ? '/api' : 'https://evenup-tayr.onrender.com/api';
  } catch (e) {
    // Fallback if location is not available
    window.API_BASE = '/api';
  }
})();
