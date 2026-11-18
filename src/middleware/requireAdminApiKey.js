
import { timingSafeEqual } from 'node:crypto';

const requireAdminApiKey = (req, res, next) => {
  const expectedKey = process.env.ADMIN_API_KEY;
  const providedKey = req.get('x-admin-api-key');

  if (!expectedKey) {
    return res.status(503).json({
      message: 'Admin API access is not configured'
    });
  }

  if (!providedKey) {
    return res.status(401).json({
      message: 'Admin API key is required'
    });
  }

  const expected = Buffer.from(expectedKey);
  const provided = Buffer.from(providedKey);

  if (
    expected.length !== provided.length ||
    !timingSafeEqual(expected, provided)
  ) {
    return res.status(403).json({
      message: 'Invalid admin API key'
    });
  }

  return next();
};

export { requireAdminApiKey };
