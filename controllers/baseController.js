class BaseController {
    // Send a success response
    sendResponse(res, data = null, message = 'Success', statusCode = 200) {
        const response = {
            success: true,
            message,
            ...(data && { data })
        };
        return res.status(statusCode).json(response);
    }

    // Send an error response
    sendError(res, error, statusCode = 500) {
        console.error('Error:', error);
        const response = {
            success: false,
            error: error.message || 'An unexpected error occurred'
        };
        return res.status(statusCode).json(response);
    }

    // Wrapper for async route handlers to catch errors
    asyncHandler(fn) {
        return async (req, res, next) => {
            try {
                await fn(req, res, next);
            } catch (error) {
                return this.sendError(res, error);
            }
        };
    }
}

module.exports = BaseController; 