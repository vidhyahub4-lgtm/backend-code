const jwt = require('jsonwebtoken')
const User = require('../models/super-admin/userModel')

const generateAccessToken = (userId,userType) => {
    return jwt.sign({ id: userId, userType }, process.env.JWT_ACCESS_SECRET, {
        expiresIn: '1d', // short-lived
    })
}

const generateRefreshToken = (userId,userType) => {
    return jwt.sign({ id: userId, userType }, process.env.JWT_REFRESH_SECRET, {
        expiresIn: '7d', // long-lived
    })
}



const refreshAccessToken = async (refreshToken) => {
    if (!refreshToken) {
        throw new Error('No refresh token provided')
    }

    let decoded
    try {
        decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET)
    } catch (err) {
        throw new Error('Invalid or expired refresh token')
    }

    const user = await User.findById(decoded.id)
    if (!user || user.refreshToken !== refreshToken) {
        throw new Error('Refresh token does not match') // handles revoked/rotated tokens
    }

    const newAccessToken = generateAccessToken(user._id)
    return newAccessToken
}
module.exports = { generateAccessToken, generateRefreshToken, refreshAccessToken }