/**
 * Simulated Email Service for V.I.B.E Platform
 * Handles real-time notifications for subscriptions and bids.
 */

class EmailService {
  /**
   * Send auction subscription confirmation
   */
  static async sendSubscriptionAlert(email, auctionTitle) {
    console.log(`[REAL-TIME GMAIL SIMULATOR] Sending email to: ${email}`);
    console.log(`Subject: ✓ Subscribed to "${auctionTitle}"`);
    console.log(`Content: You will now receive real-time updates for this auction on V.I.B.E.`);
    
    // Simulate network delay
    return new Promise(resolve => setTimeout(resolve, 800));
  }

  /**
   * Send new bid alert to seller/subscribers
   */
  static async sendBidAlert(email, auctionTitle, amount) {
    console.log(`[REAL-TIME GMAIL SIMULATOR] Sending bid alert to: ${email}`);
    console.log(`Subject: ⚡ New Bid on "${auctionTitle}"`);
    console.log(`Content: A new bid of $${amount.toLocaleString()} has been placed.`);
    
    return new Promise(resolve => setTimeout(resolve, 500));
  }

  /**
   * Send newsletter confirmation
   */
  static async sendNewsletterSignup(email) {
    console.log(`[REAL-TIME GMAIL SIMULATOR] Sending welcome email to: ${email}`);
    console.log(`Subject: Welcome to V.I.B.E Collector Circle`);
    
    return new Promise(resolve => setTimeout(resolve, 1000));
  }
}

module.exports = EmailService;
