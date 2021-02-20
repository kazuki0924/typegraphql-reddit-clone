import nodemailer from 'nodemailer';

export const sendEmail = async (to: string, html: string) => {
	// const testAccount = await nodemailer.createTestAccount();
	// console.log('testAccount', testAccount);

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
		subject: 'Change',
		html,
	});

	console.log('Message sent: %s', info.messageId);
	// Message sent: <b658f8ca-6296-ccf4-8306-87d57a0b4321@example.com>

	// Preview only available when sending through an Ethereal account
	console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
	// Preview URL: https://ethereal.email/message/WaQKMgKddxQDoou...
};
