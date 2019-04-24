const express = require('express');
const app = express();
const multer = require('multer');
const jimp = require('jimp');
const path = require('path');
const bodyParser = require('body-parser');
var LocalStorage = require('node-localstorage').LocalStorage;
localStorage = new LocalStorage('./scratch');

//If you'd like to use hbs partials you need next line
//const hbs = require('hbs');

//If you'd like to use '.html' extension you should use next line also
//app.engine('html', require('hbs'.__express));
app.set('view engine', 'hbs');

const port = process.env.port || 3000;

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

app.use('/', (req, res) =>
	res.render('index', {
		contactList: JSON.parse(localStorage.getItem('contacts'))
	})
);

app.listen(port, () => console.log(`Server started on ${port}`));
