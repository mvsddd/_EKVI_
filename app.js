const express = require('express');
const mysql = require('mysql2');
const path = require('path');
const bcrypt = require('bcryptjs');
const cookieParser = require('cookie-parser');

const app = express();
const DATABASE = 'login';
const DATABASE_HOST = 'localhost';
const DATABASE_USER = 'root';
const DATABASE_PASSWORD = '9xsDD9685_';

const db = mysql.createConnection({
    host: DATABASE_HOST,
    user: DATABASE_USER,
    password: DATABASE_PASSWORD,
    database: DATABASE
})

db.connect((error) => {
    if(error) {
        console.log(error)
    } else {
        console.log('MySQL connected!')
    }
})

app.set('view engine', 'hbs')


const publicDir = path.join(__dirname, './public');

app.use(express.static(publicDir));
app.use(cookieParser());

app.use((req, res, next) => {
    res.locals.authenticated = req.cookies.authenticated ? true : false;
    next();
});

app.get('/', (req, res) => {
    res.render('index')
});

app.listen(5000, ()=> {
    console.log('server started on port 5000')
});


app.get('/register', (req, res) => {
    res.render('register')
});

app.get('/login', (req, res) => {
    res.render('login')
});

app.get('/logout', (req, res) => {
    res.clearCookie('authenticated');
    res.redirect('/');
});



app.use(express.urlencoded({extended: 'false'}));
app.use(express.json());


app.post('/auth/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        db.query(' SELECT * FROM users WHERE email = ? ', [email], async (error, result) => {
            if (error) {
                console.log(error)
            }

            if (bcrypt.compareSync(password, result[0].password)) {
                const eightHoursExpires = 8 * 36e5;

                res.cookie('authenticated', '1', { expires: new Date(Date.now() + eightHoursExpires), httpOnly: true })

                return res.render('login', { authenticated: true, authSuccess: true } );
            }

            return res.render('login', { authFailed: true } );
        })

    } catch (error) {
        // Обработка ошибок
        console.error(error);
        return res.status(500).send('Internal Server Error');
    }
});



app.post('/auth/register', async (req, res) => {
    const { name, email, password, password_confirm } = req.body

    try {
        db.query('SELECT email FROM users WHERE email = ?', [email], async (error, result) => {
            if (error) {
                console.log(error)
            }

            if (result.length > 0) {
                return res.render('register', {
                    message: 'Этот email уже зарегистрирован'
                });
            } else if (password && password !== password_confirm) {
                return res.render('register', {
                    message: 'Пароли не совпадают!'
                });
            }

            const hashedPassword = await bcrypt.hash(password, 8);
    
            db.query('INSERT INTO users SET?', { name, email, password: hashedPassword }, (error) => {
                if (error) {
                    console.log(error)
                } else {
                    return res.render('register', {
                        regSuccess: true
                    })
                }
            });
        });

    } catch (error) {
        // Обработка ошибок
        console.error(error);
        return res.status(500).send('Internal Server Error');
    }
    
});

