const crypto = require('crypto');

function generateSixDigitOtp() {
  return String(crypto.randomInt(0, 1_000_000)).padStart(6, '0');
}

function otpMatchesStored(inputOtp, storedOtp) {
  const a = String(inputOtp ?? '').trim();
  const b = String(storedOtp ?? '').trim();
  if (a.length !== 6 || b.length !== 6) return false;
  try {
    return crypto.timingSafeEqual(Buffer.from(a, 'utf8'), Buffer.from(b, 'utf8'));
  } catch {
    return false;
  }
}

module.exports = {
  generateSixDigitOtp,
  otpMatchesStored,
};
