import Contact from "../models/contact.model.js"
import path from 'path';
import { v4 as uuid } from 'uuid';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import nodemailer from 'nodemailer'
import dotenv from 'dotenv'
dotenv.config()

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: false, // true for 465, false for other ports
    auth: {
        user: process.env.SMTP_MAIL,
        pass: process.env.SMTP_PASSWORD
    }
})

export const postContactData = async(req, res) => {
    try {
        const {name, email, phone, category, query} = req.body

        if(!name || !email || !phone || !category) {
            return res.status(422).json({error: "Fill all the fields."})
        }

        if(phone.length <= 10) {
            return res.status(422).json({error: "Please enter valid phone number"})
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

        if(!emailRegex.test(email)) {
            return res.status(422).json({error: "Invalid Email format"})
        }

        const newEmail = email.toLowerCase()

        let newFileName = null;
        if (req.files && req.files.attachment) {
            const {attachment} = req.files

            if(attachment.size > 2000000) {
                return res.status(422).json({error: "Attachment should be less than 2mb"})
            }

            let filename = attachment.name
            let splittedFileName = filename.split('.')
            newFileName = splittedFileName[0] + uuid() + "." + splittedFileName[splittedFileName.length - 1]

            attachment.mv(path.join(__dirname, '..', '/uploads', newFileName), async(err) => {
                if(err) {
                    console.error(err);
                    return res.status(500).json({ error: "Error uploading attachment" });
                }
            })
        }

        const newContact = await Contact.create({
            name,
            email: newEmail,
            phone,
            category,
            query,
            attachment: newFileName
        })

        if(!newContact) {
            return res.status(422).json({error: "Query couldn't be sent"})
        }
      
        //Sending email

        const mailOptions = {
            from: process.env.SMTP_MAIL,
            to: "ayushpkukreti@gmail.com",
            subject: "User query details from blog app",
            html: `<p>Name: ${name}</p><p>Email: ${newEmail}</p><p>Phone: ${phone}</p><p>Category: ${category}</p><p>Query: ${query}</p>`,
            ...(newFileName && {
                attachments: [
                    {
                        filename: newFileName,
                        path: path.join(__dirname, '..', 'uploads', newFileName)
                    }
                ]
            })
        };

        transporter.sendMail(mailOptions, (error) => {
            if (error) {
                console.log(error);
            } else {
                console.log("Email sent successfully");
            }
        });

        res.status(201).json(newContact)

    } catch (error) {
        console.log("Error in postContactData controller", error.message)
        res.status(500).json({error: "Internal server error"})
    }
}