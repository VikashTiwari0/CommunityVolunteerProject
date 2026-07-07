import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

// Configure Cloudinary using process.env credentials
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

/**
 * Uploads a local file to Cloudinary and deletes it locally afterwards.
 * @param {string} localFilePath - Path to local file
 * @returns {Promise<{ secure_url: string, public_id: string }>}
 */
export const uploadToCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) return null;

        // Upload file to Cloudinary
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto",
            folder: "unity_volunteer"
        });

        // Unlink (delete) the temporary local file safely
        if (fs.existsSync(localFilePath)) {
            fs.unlinkSync(localFilePath);
        }

        return {
            secure_url: response.secure_url,
            public_id: response.public_id
        };
    } catch (error) {
        console.error("Cloudinary Upload Error:", error);
        // Clean up the local file even if upload fails
        if (localFilePath && fs.existsSync(localFilePath)) {
            fs.unlinkSync(localFilePath);
        }
        throw error;
    }
};

/**
 * Deletes a file from Cloudinary using its public ID.
 * @param {string} publicId - Cloudinary public ID
 * @returns {Promise<any>}
 */
export const deleteFromCloudinary = async (publicId) => {
    try {
        if (!publicId) return null;
        const response = await cloudinary.uploader.destroy(publicId);
        return response;
    } catch (error) {
        console.error("Cloudinary Deletion Error:", error);
        throw error;
    }
};
