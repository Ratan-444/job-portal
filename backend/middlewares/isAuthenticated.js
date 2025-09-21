import jwt from "jsonwebtoken";

const isAuthenticated = async (req, res, next) => {
    try {
        const token = req.cookies.token;
        if (!token) {
            console.error("Authentication Error: Token missing in cookies");
            return res.status(401).json({
                message: "User not authenticated",
                success: false,
            });
        }
        
        const decode = jwt.verify(token, process.env.SECRET_KEY);
        if (!decode) {
            console.error("Authentication Error: Invalid token");
            return res.status(401).json({
                message: "Invalid token",
                success: false,
            });
        }
        req.id = decode.userId;
        next();
    } catch (error) {
        console.error("Authentication Error:", error.message);
        return res.status(401).json({
            message: "User not authenticated",
            success: false,
        });
    }
};
export default isAuthenticated;
