const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
    const token = req.cookies.token;

    if (!token) {
        return res.status(401).json({ error: 'Authorization token not found.' });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Invalid authorization token.' }); // Forbidden
        }
        req.user = user; // Attach the decoded user information to the request object
        next(); // Proceed to the next middleware or route handler
    });
};

module.exports = authenticateToken;