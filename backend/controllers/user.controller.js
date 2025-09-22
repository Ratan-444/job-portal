import { User } from "../models/user.model.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import getDataUri from "../utils/datauri.js";
import cloudinary from "../utils/cloudinary.js";

// ---------------- REGISTER ----------------
export const register = async (req, res) => {
    try {
        const { fullname, email, phoneNumber, password, role } = req.body;

        if (!fullname || !email || !phoneNumber || !password || !role) {
            return res.status(400).json({
                message: "Something is missing",
                success: false
            });
        }

        const file = req.file;
        let profilePhotoUrl = "";
        if (file) {
            const fileUri = getDataUri(file);
            const cloudResponse = await cloudinary.uploader.upload(fileUri.content);
            profilePhotoUrl = cloudResponse.secure_url;
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({
                message: "User already exists with this email.",
                success: false
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        await User.create({
            fullname,
            email,
            phoneNumber,
            password: hashedPassword,
            role,
            profile: {
                profilePhoto: profilePhotoUrl,
            }
        });

        return res.status(201).json({
            message: "Account created successfully.",
            success: true
        });

    } catch (error) {
        console.error("Register Error:", error.message);
        return res.status(500).json({ message: "Internal Server Error", success: false });
    }
}

// ---------------- LOGIN ----------------
export const login = async (req, res) => {
    try {
        const { email, password, role } = req.body;

        if (!email || !password || !role) {
            return res.status(400).json({
                message: "Something is missing",
                success: false
            });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({
                message: "Incorrect email or password.",
                success: false
            });
        }

        const isPasswordMatch = await bcrypt.compare(password, user.password);
        if (!isPasswordMatch) {
            return res.status(400).json({
                message: "Incorrect email or password.",
                success: false
            });
        }

        if (role !== user.role) {
            return res.status(400).json({
                message: "Account doesn't exist with current role.",
                success: false
            });
        }

        const token = jwt.sign({ userId: user._id }, process.env.SECRET_KEY, { expiresIn: '1d' });

        const responseUser = {
            _id: user._id,
            fullname: user.fullname,
            email: user.email,
            phoneNumber: user.phoneNumber,
            role: user.role,
            profile: user.profile
        };

        // Set cookie for cross-site requests
const isProd = process.env.NODE_ENV === "production";

return res.status(200).cookie("token", token, {
    maxAge: 24 * 60 * 60 * 1000, // 1 day in milliseconds
    httpOnly: true,              // prevents JS access to cookie
    secure: isProd,              // HTTPS only in production
    sameSite: isProd ? "none" : "lax" // allows cross-site in production, works on localhost for dev
}).json({
    message: `Welcome back ${user.fullname}`,
    user: responseUser,
    success: true
});

    } catch (error) {
        console.error("Login Error:", error.message);
        return res.status(500).json({ message: "Internal Server Error", success: false });
    }
}

// ---------------- LOGOUT ----------------
export const logout = async (req, res) => {
    try {
        return res.status(200).cookie("token", "", {
            maxAge: 0,
            httpOnly: true,
            secure: true,
            sameSite: "none"
        }).json({
            message: "Logged out successfully.",
            success: true
        });
    } catch (error) {
        console.error("Logout Error:", error.message);
        return res.status(500).json({ message: "Internal Server Error", success: false });
    }
}

// ---------------- UPDATE PROFILE ----------------
export const updateProfile = async (req, res) => {
    try {
        const { fullname, email, phoneNumber, bio, skills } = req.body;

        const file = req.file;
        let resumeUrl = "";
        let resumeOriginalName = "";
        if (file) {
            const fileUri = getDataUri(file);
            const cloudResponse = await cloudinary.uploader.upload(fileUri.content);
            resumeUrl = cloudResponse.secure_url;
            resumeOriginalName = file.originalname;
        }

        const userId = req.id; // from isAuthenticated middleware
        const user = await User.findById(userId);
        if (!user) {
            return res.status(400).json({
                message: "User not found.",
                success: false
            });
        }

        if (fullname) user.fullname = fullname;
        if (email) user.email = email;
        if (phoneNumber) user.phoneNumber = phoneNumber;
        if (bio) user.profile.bio = bio;
        if (skills) user.profile.skills = skills.split(",");
        if (resumeUrl) {
            user.profile.resume = resumeUrl;
            user.profile.resumeOriginalName = resumeOriginalName;
        }

        await user.save();

        const responseUser = {
            _id: user._id,
            fullname: user.fullname,
            email: user.email,
            phoneNumber: user.phoneNumber,
            role: user.role,
            profile: user.profile
        };

        return res.status(200).json({
            message: "Profile updated successfully.",
            user: responseUser,
            success: true
        });

    } catch (error) {
        console.error("Update Profile Error:", error.message);
        return res.status(500).json({ message: "Internal Server Error", success: false });
    }
}
