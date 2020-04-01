import { get, put, post, del } from "./requester.js";

const app = Sammy('#solution', function () {
    this.use('Handlebars', 'hbs');

    this.get('/index.html', function (ctx) {
        setHeaderInfo(ctx);
        if (ctx.isLogged) {
            this.loadPartials(getPartials())
                .partial('./views/home.hbs');
        } else {
            this.loadPartials(getPartials())
                .partial('./views/home.hbs');
        }
    })
    this.get('/register', function (ctx) {
        setHeaderInfo(ctx);

        this.loadPartials(getPartials())
            .partial('./views/actions/register.hbs');
    })
    this.post('/register', function (ctx) {
        const { username, password, rePassword } = ctx.params;
        if (username && password && password === rePassword) {
            post('user', '', { username, password }, 'Basic')
                .then((userInfo) => {
                    saveAuthInfo(userInfo);
                    ctx.redirect('/index.html');
                })
                .catch(console.error);
        } else {
            errorEvent('Invalid information.')
        }
    })
    this.get('/logout', function (ctx) {
        post('user', '_logout', {}, 'Kinvey')
            .then(() => {
                sessionStorage.clear();
                ctx.redirect('/index.html');
            })
            .catch(console.error);
    })
    this.get('/login', function (ctx) {
        setHeaderInfo(ctx);

        this.loadPartials(getPartials())
            .partial('/views/actions/login.hbs');
    })
    this.post('/login', function (ctx) {
        setHeaderInfo(ctx);
        const { username, password } = ctx.params;
        post('user', 'login', { username, password }, 'Basic')
            .then((userInfo) => {
                loadingEvent();
                saveAuthInfo(userInfo);
                ctx.redirect('/index.html');
            })
            .catch(() => errorEvent('Invalid login info.'));
    })
    this.get('/create', function (ctx) {
        setHeaderInfo(ctx);

        this.loadPartials(getPartials())
            .partial('./views/causes/create.hbs');
    })
    this.post('/create', function (ctx) {
        const { cause, pictureUrl, neededFunds, description } = ctx.params;

        post('appdata', 'causes', { cause, pictureUrl, neededFunds, description, donors: [], collectedFunds: 0 }, 'Kinvey')
            .then(() => {
                ctx.redirect('/index.html');
            })
            .catch(console.error);
    })
    this.get('/dashboard', async function (ctx) {
        setHeaderInfo(ctx);
        const causes = await get('appdata', 'causes', 'Kinvey');
        ctx.causes = causes;
        ctx.hasCauses = causes.length;
        this.loadPartials(getPartials())
            .partial('./views/dashboard.hbs');
    })
    this.get('/details/:id', async function (ctx) {
        setHeaderInfo(ctx);
        const id = ctx.params.id;
        const cause = await get('appdata', `causes/${id}`, 'Kinvey');
        ctx.cause = cause;
        ctx.isCreator = cause._acl.creator === sessionStorage.getItem('userId');

        this.loadPartials(getPartials())
            .partial('../views/causes/details.hbs');
    })
    this.get('/donate/:id', async function (ctx) {
        setHeaderInfo(ctx);
        const id = ctx.params.id;
        const currentDonation = ctx.params.currentDonation;

        const cause = await get('appdata', `causes/${id}`, 'Kinvey');
        const donors = cause.donors;
        donors.push(sessionStorage.getItem('username'));

        put('appdata', `causes/${id}`, {
            cause: cause.cause,
            pictureUrl: cause.pictureUrl,
            neededFunds: cause.neededFunds,
            description: cause.description,
            donors: cause.donors,
            collectedFunds: +cause.collectedFunds + +currentDonation
        }).then(() => {
            ctx.redirect('/index.html');
        })
            .catch(console.error);
    })
    this.get('/close/:id', function (ctx) {
        setHeaderInfo(ctx);
        const id = ctx.params.id;
        del('appdata', `causes/${id}`, 'Kinvey')
            .then(() => {
                ctx.redirect('/index.html');
            })
            .catch(console.error);
    })
})
app.run();

function getPartials() {
    return {
        header: '../views/common/header.hbs',
        footer: '../views/common/footer.hbs'
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

function loadingEvent() {
    const element = document.getElementById('loadingNotification');
    element.style.display = 'block';
    setTimeout(function () {
        element.style.display = 'none'
    }, 3000);
}
function completedEvent() {
    const element = document.getElementById('successNotification');
    element.style.display = 'block';
    setTimeout(function () {
        element.style.display = 'none'
    }, 3000);
}
function errorEvent(content) {
    const element = document.getElementById('errorNotification');
    element.style.display = 'block';
    element.textContent = content;
    setTimeout(function () {
        element.style.display = 'none'
    }, 3000);
}