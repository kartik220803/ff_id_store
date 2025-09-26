const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
    try {
        // Create transporter
        const transporter = nodemailer.createTransporter({
            host: process.env.SMTP_HOST || 'smtp.gmail.com',
            port: process.env.SMTP_PORT || 587,
            secure: false, // true for 465, false for other ports
            auth: {
                user: process.env.SMTP_EMAIL,
                pass: process.env.SMTP_PASSWORD,
            },
        });

        // Define email options
        const message = {
            from: `${process.env.FROM_NAME || 'FF-ID-STORE'} <${process.env.FROM_EMAIL || process.env.SMTP_EMAIL}>`,
            to: options.email,
            subject: options.subject,
            html: options.html,
        };

        // Send email
        const info = await transporter.sendMail(message);
        console.log('Email sent successfully: %s', info.messageId);
    } catch (error) {
        console.error('Email sending failed:', error.message);

        // For development: Log email content instead of failing
        if (process.env.NODE_ENV === 'development') {
            console.log('=== EMAIL CONTENT (Development Mode) ===');
            console.log('To:', options.email);
            console.log('Subject:', options.subject);
            console.log('HTML Content:', options.html);
            console.log('==========================================');
            return; // Don't throw error in development
        }

        throw error;
    }
};

module.exports = sendEmail;
