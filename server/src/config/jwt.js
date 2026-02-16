module.exports = {
  accessToken: {
    secret: process.env.JWT_SECRET,
    expire: process.env.JWT_EXPIRE || '15m',
  },
  refreshToken: {
    secret: process.env.JWT_REFRESH_SECRET,
    expire: process.env.JWT_REFRESH_EXPIRE || '7d',
  },
  cookie: {
    expire: parseInt(process.env.JWT_COOKIE_EXPIRE, 10) || 7, // jours
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
  },
};
