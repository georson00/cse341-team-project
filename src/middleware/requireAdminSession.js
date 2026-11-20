
const requireAdminSession = (req, res, next) => {
    if (req.session?.isAdmin === true) {
        return next();
    }

    return res.status(401).json({
        message: 'Administrator authentication required'
    });
};

export { requireAdminSession };
