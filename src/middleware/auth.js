
export const requireApiLogin = () => {
  return (req, res, next) => {
    if (!req.session.user) {
      return res.status(401).json({
        message: 'Please log in first.'
      });
    }

    return next();
  };
};

export const requirePageLogin = () => {
  return (req, res, next) => {
    if (!req.session.user) {
      return res.redirect('/auth/login');
    }

    return next();
  };
};

export const requireApiRole = (role) => {
  return (req, res, next) => {
    if (!req.session.user) {
      return res.status(401).json({
        message: 'Please log in first.'
      });
    }

    if (req.session.user.role !== role) {
      return res.status(403).json({
        message: 'You do not have permission to access this resource.'
      });
    }

    return next();
  };
};

export const requirePageRole = (role) => {
  return (req, res, next) => {
    if (!req.session.user) {
      return res.redirect('/auth/login');
    }

    if (req.session.user.role !== role) {
      return res.status(403).render('errors/403');
    }

    return next();
  };
};
