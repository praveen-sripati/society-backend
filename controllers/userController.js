const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/database');
const BaseController = require('./baseController');

class UserController extends BaseController {
    // Resident Registration with JWT Generation
    async registerResident(req, res) {
        const { apartment_number, mobile_number, password } = req.body;

        if (!apartment_number || !mobile_number || !password) {
            return this.sendError(res, new Error('Please provide all required fields.'), 400);
        }

        // Check if the mobile number or apartment number already exists
        const existingUser = await pool.query('SELECT * FROM users WHERE mobile_number = $1 OR apartment_number = $2', [
            mobile_number,
            apartment_number,
        ]);

        if (existingUser.rows.length > 0) {
            return this.sendError(res, new Error('Mobile number or apartment number already registered.'), 409);
        }

        // Hash the password
        const saltRounds = 10;
        const passwordHash = await bcrypt.hash(password, saltRounds);

        // Insert the new resident into the database
        const newUser = await pool.query(
            'INSERT INTO users (apartment_number, mobile_number, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING *',
            [apartment_number, mobile_number, passwordHash, 'resident']
        );

        const user = newUser.rows[0];

        // Generate a JWT
        const payload = {
            userId: user.id,
            role: user.role,
        };

        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '24h' });

        // Set the JWT as an HTTP-only cookie
        res.cookie('token', token, {
            httpOnly: true,
            secure: false, // Set to true in production
            sameSite: 'lax',
            maxAge: 24 * 60 * 60 * 1000, // 24 hours
            path: '/',
        });

        return this.sendResponse(
            res,
            { user: { id: user.id, role: user.role } },
            'Resident registered successfully.',
            201
        );
    }

    // User Login
    async login(req, res) {
        const { mobile_number, password } = req.body;

        if (!mobile_number || !password) {
            return this.sendError(res, new Error('Please provide mobile number and password.'), 400);
        }

        // Find the user by mobile number
        const userResult = await pool.query('SELECT * FROM users WHERE mobile_number = $1', [mobile_number]);
        const user = userResult.rows[0];

        if (!user) {
            return this.sendError(res, new Error('Invalid credentials.'), 401);
        }

        // Compare the provided password with the stored password hash
        const passwordMatch = await bcrypt.compare(password, user.password_hash);

        if (!passwordMatch) {
            return this.sendError(res, new Error('Invalid credentials.'), 401);
        }

        // Generate a JWT
        const payload = {
            userId: user.id,
            role: user.role,
        };

        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '24h' });

        // Set the JWT as an HTTP-only cookie
        res.cookie('token', token, {
            httpOnly: true,
            secure: false, // Set to true in production
            sameSite: 'lax',
            maxAge: 24 * 60 * 60 * 1000, // 24 hours
            path: '/',
        });

        return this.sendResponse(
            res,
            { user: { id: user.id, role: user.role } },
            'Login successful.',
            200
        );
    }

    // Get current user details
    async getCurrentUser(req, res) {
        const userResult = await pool.query('SELECT id, apartment_number, mobile_number, role FROM users WHERE id = $1', [
            req.user.userId,
        ]);
        const userDetails = userResult.rows[0];

        if (!userDetails) {
            return this.sendError(res, new Error('User not found.'), 404);
        }

        return this.sendResponse(res, userDetails);
    }

    // Logout
    async logout(req, res) {
        // Clear the JWT cookie
        res.clearCookie('token', {
            httpOnly: true,
            secure: false, // Set to true in production
            sameSite: 'lax',
            path: '/',
        });

        return this.sendResponse(res, null, 'Logged out successfully.');
    }
}

module.exports = new UserController(); 