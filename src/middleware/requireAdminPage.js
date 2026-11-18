
const requireAdminPage = (req, res, next) => {
    if (req.session?.isAdmin === true) {
        return next();
    }

    return res.redirect('/admin/login');
};

export { requireAdminPage };
