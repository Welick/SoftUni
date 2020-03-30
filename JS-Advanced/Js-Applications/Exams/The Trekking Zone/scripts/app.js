import { get, post, put, del } from "./requester.js";

const app = Sammy('#solve', function () {
    this.use('Handlebars', 'hbs');

    this.get('/index.html', function (ctx) {
        setHeaderInfo(ctx);
        if (ctx.isLogged) {
            get('appdata', 'treks', 'Kinvey')
                .then((treks) => {
                    const sortedTreks = treks.sort((a, b) => b.likes - a.likes);
                    ctx.treks = sortedTreks;
                    this.loadPartials(getPartials())
                        .partial('./templates/home.hbs');
                })
        } else {
            this.loadPartials(getPartials())
                .partial('./templates/home.hbs');
        }
    })
    this.get('/register', function (ctx) {
        setHeaderInfo(ctx);
        this.loadPartials(getPartials())
            .partial('./templates/actions/register.hbs');
    })
    this.get('/login', function (ctx) {
        setHeaderInfo(ctx);
        this.loadPartials(getPartials())
            .partial('./templates/actions/login.hbs');
    })
    this.post('/register', function (ctx) {
        setHeaderInfo(ctx);
        const { username, password, rePassword } = ctx.params;

        if (username.length >= 3 && password.length >= 6 && password === rePassword) {
            post('user', '', { username, password }, 'Basic')
                .then((userInfo) => {
                    saveAuthInfo(userInfo);
                    showInfo('Successfully registered user.');
                    ctx.redirect('/index.html');
                }).catch(handleError);
        }
    })
    this.post('/login', function (ctx) {
        setHeaderInfo(ctx);
        const { username, password } = ctx.params;
        if (username && password) {
            post('user', 'login', { username, password }, 'Basic')
                .then((userInfo) => {
                    saveAuthInfo(userInfo);
                    showInfo('Successfully logged user.');
                    ctx.redirect('/index.html');
                }).catch(handleError);
        }
    })
    this.get('/logout', function (ctx) {
        setHeaderInfo(ctx);

        post('user', '_logout', {}, 'Kinvey')
            .then(() => {
                sessionStorage.clear();
                showInfo('Logout successful.');
                //setTimeout(() => ctx.redirect('/index.html'), 1000);
                ctx.redirect('/index.html');
            }).catch(handleError);
    })
    this.get('/create', function (ctx) {
        setHeaderInfo(ctx);
        this.loadPartials(getPartials())
            .partial('./templates/trek/create.hbs');
    })
    this.post('/create', function (ctx) {
        setHeaderInfo(ctx);
        const { location, dateTime, description, imageURL } = ctx.params;

        post('appdata', 'treks', {
            location,
            dateTime,
            description,
            imageURL,
            organizer: sessionStorage.getItem('username'),
            likes: 0
        }, 'Kinvey')
            .then(() => {
                showInfo('Trek created successfully.');
                ctx.redirect('/index.html');
            }).catch(handleError);
    })
    this.get('/details/:id', async function (ctx) {
        setHeaderInfo(ctx);
        const id = ctx.params.id;

        const trek = await get('appdata', `treks/${id}`, 'Kinvey');

        ctx.trek = trek;
        ctx.isHim = trek.organizer === sessionStorage.getItem('username') ? true : false;

        this.loadPartials(getPartials())
            .partial('../templates/trek/details.hbs');
    })
    this.get('/edit/:id', async function (ctx) {
        setHeaderInfo(ctx);
        const id = ctx.params.id;
        const trek = await get('appdata', `treks/${id}`, 'Kinvey');
        ctx.trek = trek;
        this.loadPartials(getPartials())
            .partial('../templates/trek/edit.hbs');
    })
    this.post('/edit/:id', function (ctx) {
        setHeaderInfo(ctx);
        const id = ctx.params.id;

        const { location, dateTime, description, imageURL, organizer, likes } = ctx.params;
        put('appdata', `treks/${id}`, {
            location,
            dateTime,
            description,
            imageURL,
            organizer,
            likes: +likes
        }, 'Kinvey')
            .then(() => {
                showInfo('Trek edited successfully.');
                ctx.redirect('/index.html');
            }).catch(handleError);
    })
    this.get('/close/:id', function (ctx) {
        setHeaderInfo(ctx);
        const id = ctx.params.id;
        del('appdata', `treks/${id}`, 'Kinvey')
            .then(() => {
                showInfo('You closed the trek successfully.');
                ctx.redirect('/index.html');
            }).catch(handleError);
    })
    this.get('/like/:id', async function (ctx) {
        setHeaderInfo(ctx);
        const id = ctx.params.id;
        const trek = await get('appdata', `treks/${id}`, 'Kinvey');

        put('appdata', `treks/${id}`, {
            location: trek.location,
            dateTime: trek.dateTime,
            description: trek.description,
            imageURL: trek.imageURL,
            organizer: trek.organizer,
            likes: +trek.likes + 1
        }).then(() => {
            showInfo('You liked the trek successfully.');
            ctx.redirect('/index.html');
        }).catch(handleError);
    })
    this.get('/profile', function (ctx) {
        setHeaderInfo(ctx);
        get('appdata', 'treks', 'Kinvey')
            .then((treks) => {
                const myTreks = treks.filter(x => x.organizer === sessionStorage.getItem('username')).map(x => x.location);
                ctx.treks = myTreks;
                ctx.treksCount = myTreks.length;
                this.loadPartials(getPartials())
                    .partial('./templates/profile.hbs');
            }).catch(handleError);
    })
})
app.run();

function getPartials() {
    return {
        header: './templates/common/header.hbs',
        footer: './templates/common/footer.hbs',
        guestHome: './templates/guestHome.hbs',
        loggedHome: './templates/loggedHome.hbs'
    }
}
function setHeaderInfo(ctx) {
    ctx.isLogged = sessionStorage.getItem('authtoken') !== null;
    ctx.username = sessionStorage.getItem('username');
}
function saveAuthInfo(userInfo) {
    sessionStorage.setItem('authtoken', userInfo._kmd.authtoken);
    sessionStorage.setItem('username', userInfo.username);
    sessionStorage.setItem('userId', userInfo._id);
}
function showInfo(message) {
    const infoBox = document.getElementById('successBox');
    infoBox.textContent = message;
    infoBox.style.display = 'block';
    setTimeout(() => infoBox.style.display = 'none', 3000);
}
function showError(message) {
    const infoBox = document.getElementById('errorBox');
    infoBox.textContent = message;
    infoBox.style.display = 'block';
    setTimeout(() => infoBox.style.display = 'none', 3000);
}
function handleError(reason) {
    showError(reason.message);
}