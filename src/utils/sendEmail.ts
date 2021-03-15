import nodemailer from 'nodemailer';

export const sendEmail = async (to: string, html: string) => {
	const transporter = nodemailer.createTransport({
		host: 'smtp.ethereal.email',
		port: 587,
		secure: false, // true for 465, false for other ports
		auth: {
			user: 'mnzotq5gwkemyppq@ethereal.email',
			pass: 'HXcNSKsFH4xKwBvAfH',
		},
	});

	const info = await transporter.sendMail({
		from: 'test <test@test.com>',
		to,
		subject: 'Change password',
		html,
	});

	console.log('Message sent: %s', info.messageId);
	console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
};
