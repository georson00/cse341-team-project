
import { requireAdminApiKey } from './requireAdminApiKey.js';

const requireBookingAdmin = (req, res, next) => {
    // Allow administrators who have an authenticated session.
    if (req.session?.isAdmin === true) {
        return next();
    }

    // Otherwise, check for a valid API key.
    return requireAdminApiKey(req, res, next);
};

export { requireBookingAdmin };
