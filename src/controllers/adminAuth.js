
import { timingSafeEqual } from 'node:crypto';

const adminLoginPage = (req, res) => {
    if (req.session?.isAdmin === true) {
        return res.redirect('/bookings-admin');
    }

    return res.render('admin/login', {
        title: 'Administrator Login',
        error: null
    });
};

const processAdminLogin = (req, res, next) => {
    const expectedKey = process.env.ADMIN_API_KEY;
    const providedKey = req.body?.adminKey;

    if (!expectedKey) {
        return res.status(503).send('Admin login is not configured');
    }

    if (typeof providedKey !== 'string' || !providedKey) {
        return res.status(400).render('admin/login', {
            title: 'Administrator Login',
            error: 'Please enter your administrator key.'
        });
    }

    const expected = Buffer.from(expectedKey);
    const provided = Buffer.from(providedKey);

    if (
        expected.length !== provided.length ||
        !timingSafeEqual(expected, provided)
    ) {
        return res.status(401).render('admin/login', {
            title: 'Administrator Login',
            error: 'Invalid administrator key.'
        });
    }

    // Prevent session fixation by issuing a new session ID.
    return req.session.regenerate((error) => {
        if (error) return next(error);

        req.session.isAdmin = true;

        return req.session.save((saveError) => {
            if (saveError) return next(saveError);

            return res.redirect('/bookings-admin');
        });
    });
};

const processAdminLogout = (req, res, next) => {
    req.session.destroy((error) => {
        if (error) {
            return next(error);
        }

        res.clearCookie('kizuna.sid', {
            path: '/'
        });

        return res.redirect('/admin/login');
    });
};


export { adminLoginPage, processAdminLogin, processAdminLogout };
