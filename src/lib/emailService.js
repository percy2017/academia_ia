import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

let transporter;

// Configuración del transporter basada en el entorno
async function configureTransporter() {
  if (process.env.NODE_ENV === 'production') {
    // Configuración de producción (usa las variables de entorno)
    transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: parseInt(process.env.EMAIL_PORT, 10),
      secure: parseInt(process.env.EMAIL_PORT, 10) === 465,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
  } else {
    // Configuración de desarrollo (usa Ethereal para previsualizar correos)
    // Esto evita problemas de "Relay not permitted" en local.
    const testAccount = await nodemailer.createTestAccount();
    console.log('--- Ethereal test account created ---');
    console.log(`User: ${testAccount.user}`);
    console.log(`Pass: ${testAccount.pass}`);
    console.log('------------------------------------');
    
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: testAccount.user, // generated ethereal user
        pass: testAccount.pass, // generated ethereal password
      },
    });
  }
}

// Llamar a la configuración al iniciar
configureTransporter().catch(console.error);

/**
 * Sends an email.
 * @param {string} to - Recipient's email address.
 * @param {string} subject - Email subject.
 * @param {string} html - HTML body of the email.
 * @returns {Promise<void>}
 */
export const sendEmail = async (to, subject, html) => {
  // Asegurarse de que el transporter esté listo
  if (!transporter) {
    console.error('Transporter no está configurado. Esperando configuración...');
    await configureTransporter();
  }

  try {
    const mailOptions = {
      from: process.env.EMAIL_FROM || '"Academia AI" <no-reply@example.com>',
      to: to,
      subject: subject,
      html: html,
    };

    const info = await transporter.sendMail(mailOptions);
    
    if (process.env.NODE_ENV !== 'production') {
      // Si no estamos en producción, mostrar el enlace de previsualización de Ethereal
      console.log('--- Email Preview ---');
      console.log(`Message sent: ${info.messageId}`);
      console.log(`Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
      console.log('---------------------');
    } else {
      console.log(`Email sent successfully to ${to}`);
    }

  } catch (error) {
    console.error(`Error sending email to ${to}:`, error);
    throw new Error('Failed to send email.');
  }
};
