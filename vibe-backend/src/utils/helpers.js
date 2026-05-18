/**
 * Utility Functions
 */

const crypto = require('crypto');

/**
 * Generate device fingerprint
 */
function generateDeviceFingerprint(userAgent, ipAddress) {
  const combined = `${userAgent}${ipAddress}`;
  return crypto.createHash('sha256').update(combined).digest('hex');
}

/**
 * Validate email
 */
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate password strength
 */
function isStrongPassword(password) {
  // Min 8 chars
  const regex = /^.{8,}$/;
  return regex.test(password);
}

/**
 * Generate random token
 */
function generateRandomToken(length = 32) {
  return crypto.randomBytes(length).toString('hex');
}

/**
 * Calculate time remaining (in seconds)
 */
function getTimeRemaining(endTime) {
  const now = new Date();
  const end = new Date(endTime);
  return Math.max(0, Math.floor((end - now) / 1000));
}

/**
 * Format currency
 */
function formatCurrency(amount, currency = 'PKR') {
  return `${currency} ${parseFloat(amount).toFixed(2)}`;
}

/**
 * Sanitize HTML
 */
function sanitizeHTML(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Paginate results
 */
function paginate(items, limit = 20, offset = 0) {
  return {
    items: items.slice(offset, offset + limit),
    total: items.length,
    limit,
    offset,
    pages: Math.ceil(items.length / limit),
    currentPage: Math.floor(offset / limit) + 1
  };
}

module.exports = {
  generateDeviceFingerprint,
  isValidEmail,
  isStrongPassword,
  generateRandomToken,
  getTimeRemaining,
  formatCurrency,
  sanitizeHTML,
  paginate
};
