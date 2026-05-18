const BidService = require('./src/services/bidService');

console.log('Test 1: null current price');
console.log(BidService.validateBidAmount("2800", null, "2711.00", null));

console.log('Test 2: string current price');
console.log(BidService.validateBidAmount("2800", "2711.00", "2711.00", null));

console.log('Test 3: reserve price higher');
console.log(BidService.validateBidAmount("2800", "2711.00", "2711.00", "3000.00"));

console.log('Test 4: bid amount parsed');
console.log(BidService.validateBidAmount(2800, 2711.00, 2711.00, 3000.00));
