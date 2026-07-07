import nodemailer from "nodemailer";

/**
 * Sends a notification email. Falls back gracefully to console log if credentials are unset.
 * @param {string} to 
 * @param {string} subject 
 * @param {string} title 
 * @param {string} bodyContent 
 */
export const sendNotificationEmail = async (to, subject, title, bodyContent) => {
    try {
        const isConfigured = 
            process.env.EMAIL_USER && 
            process.env.EMAIL_PASS && 
            !process.env.EMAIL_USER.includes("replace_with");

        if (!isConfigured) {
            console.log("---------------- EMAIL NOTIFICATION (MOCKED) ----------------");
            console.log(`To:      ${to}`);
            console.log(`Subject: ${subject}`);
            console.log(`Title:   ${title}`);
            console.log(`Body:    ${bodyContent}`);
            console.log("-------------------------------------------------------------");
            return { success: true, message: "Email mocked to console successfully" };
        }

        // Configure Nodemailer Transporter
        const transporter = nodemailer.createTransport({
            service: process.env.EMAIL_SERVICE || "gmail",
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        const htmlTemplate = `
            <div style="font-family: Arial, sans-serif; background-color: #f8f9ff; padding: 20px; border-radius: 8px; border: 1px solid #c3c6d7;">
                <div style="background-color: #004ac6; color: white; padding: 15px; border-top-left-radius: 8px; border-top-right-radius: 8px; font-weight: bold; font-size: 18px;">
                    UnityHub Volunteer Portal
                </div>
                <div style="padding: 20px; background-color: white; color: #0b1c30; font-size: 14px; line-height: 1.6;">
                    <h3 style="color: #004ac6; margin-top: 0;">${title}</h3>
                    <p>${bodyContent}</p>
                    <p style="margin-top: 25px; border-t: 1px solid #e5eeff; padding-top: 15px; font-size: 12px; color: #737686;">
                        This is an automated notification from the UnityHub Volunteer Portal. Please do not reply.
                    </p>
                </div>
            </div>
        `;

        const mailOptions = {
            from: `"UnityHub" <${process.env.EMAIL_USER}>`,
            to,
            subject,
            html: htmlTemplate
        };

        const info = await transporter.sendMail(mailOptions);
        console.log(`Email sent successfully: ${info.messageId}`);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error("Nodemailer Send Error:", error);
        // Do not crash the application, return false so execution can proceed
        return { success: false, error: error.message };
    }
};
