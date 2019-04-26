const express = require('express');
const app = express();
const multer = require('multer');
const jimp = require('jimp');
const path = require('path');
const bodyParser = require('body-parser');
var LocalStorage = require('node-localstorage').LocalStorage;
localStorage = new LocalStorage('./scratch');
const nodemailer = require("nodemailer");

//If you'd like to use hbs partials you need next line
//const hbs = require('hbs');

//If you'd like to use '.html' extension you should use next line also
//app.engine('html', require('hbs'.__express));
app.set('view engine', 'hbs');


app.use(express.static(__dirname + '/public'));
app.use(bodyParser.urlencoded({ extended: true }));

let contacts = JSON.parse(localStorage.getItem('contacts'));
console.log(contacts);

let fileName = '';

//set storage engine
const storager = multer.diskStorage({
	destination: 'public/uploads/',
	filename: (req, file, cb) => {
		fileName = 'cp.' + Date.now() + path.extname(file.originalname);
		cb(null, fileName);
	}
});

//init upload
const upload = multer({
	storage: storager
}).single('avatar');

app.post('/newContact', (req, res) => {
	upload(req, res, () => {
		let newContact = {
			name: req.body.name,
			email: req.body.email,
			avatar: fileName
		};
		contacts.push(newContact);
		localStorage.setItem('contacts', JSON.stringify(contacts));
		console.log(contacts);

		jimp.read('public/uploads/' + fileName, (err, image) => {
			if (err) throw err;
			image
				.resize(250, 250) // canvas siyes width and height
				.quality(60) // resolution dpi
				.write('public/uploads/' + fileName); //owerwrite original one
		});

		res.redirect('/');
	});
});

app.get('/delete-contact/:index', (req, res)=>{
	const index = parseInt(req.params.index);
	console.log(index);
	contacts.splice(index, 1);
	localStorage.setItem('contacts', JSON.stringify(contacts));
	res.redirect('/');
});

let attachName = '';

//set storage engine
const attachStorager = multer.diskStorage({
	destination: 'public/attachments/',
	filename: (req, file, cb) => {
		attachName = 'ea.' + Date.now() + path.extname(file.originalname);
		cb(null, attachName);
	}
});

//init upload
const attachUpload = multer({
	storage: attachStorager
}).single('attach');

app.post('/sendMail', (req,res) => {
	attachUpload(req, res, () => {
		console.log(req.body);

		let transporter = nodemailer.createTransport({
			service: 'gmail', // true for 465, false for other ports
			auth: {
			  user: '', // generated ethereal user
			  pass: '' // generated ethereal password
			}
		});
		
		// send mail with defined transport object
		let info =  {
			from: '"Bülent\'s Contact List 👻" <bulent@mylist.com>', // sender address
			to: req.body.to, // list of receivers
			subject: req.body.subject, // Subject line
			html: `<b>${req.body.message}</b>`, // html body
			attachments: [
				{   // file on disk as an attachment
					filename: attachName,
					path: 'public/attachments/' + attachName // stream this file
				}]
		}

		transporter.sendMail(info, (err,info)=>{
			if(err){
				console.log(err);
			}else{
				console.log("Message sent: %s", info.messageId);
				// Message sent: <b658f8ca-6296-ccf4-8306-87d57a0b4321@example.com>
				
				// Preview only available when sending through an Ethereal account
				console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
				// Preview URL: https://ethereal.email/message/WaQKMgKddxQDoou...
			}
		});

		
		

		res.redirect('/');
	});
});

app.use('/', (req, res) =>
	res.render('index', {
		contactList: JSON.parse(localStorage.getItem('contacts'))
	})
);

const host = '0.0.0.0';
const port = process.env.PORT || 3000;

app.listen(port, host, () => console.log(`Server started on ${port}`));
