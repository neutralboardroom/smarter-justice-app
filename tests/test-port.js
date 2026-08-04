'use strict';

function portForTest(salt = 0) {
  const numericSalt = Number.isFinite(Number(salt)) ? Number(salt) : 0;
  return 12000 + ((process.pid * 131 + numericSalt * 977) % 50000);
}

module.exports = { portForTest };
