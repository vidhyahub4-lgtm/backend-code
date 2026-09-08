const jwt = require('jsonwebtoken')
const User = require('../models/userModel')

const authMiddleware = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                message: 'No token provided, authorization denied',
            })
        }

        const token = authHeader.split(' ')[1]

        let decoded
        try {
            decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET)
        } catch (err) {
            if (err.name === 'TokenExpiredError') {
                return res.status(401).json({
                    success: false,
                    message: 'Token expired, please login again',
                })
            }
            return res.status(401).json({
                success: false,
                message: 'Invalid token',
            })
        }

        const user = await User.findById(decoded.id || decoded._id).select('-password')

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'User not found, authorization denied',
            })
        }

        console.log('From the auth file : ',user)
        req.user = user
        next()
    } catch (error) {
        console.error('Auth middleware error:', error)
        return res.status(500).json({
            success: false,
            message: 'Server error during authentication',
        })
    }
}

module.exports = authMiddleware