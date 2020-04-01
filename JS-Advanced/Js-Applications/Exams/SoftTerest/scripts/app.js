import { get, post, put, del } from "./requester.js";

const app = Sammy('#soft', function () {
    this.use('Handlebars', 'hbs');

    this.get('/index.html', function (ctx) {
        setHeaderInfo(ctx);
        if (ctx.isLogged) {
            get('appdata', 'ideas', 'Kinvey')
                .then((ideas) => {
                    ctx.ideas = ideas;
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
    this.post('register', function (ctx) {
        setHeaderInfo(ctx);

        const { username, password, repeatPassword } = ctx.params;
        if (username.length >= 3 && password.length >= 3 && password === repeatPassword) {
            post('user', '', { username, password }, 'Basic')
                .then((userInfo) => {
                    displayLoading();
                    saveAuthInfo(userInfo);
                    ctx.redirect('/index.html');
                })
                .catch(console.error);
        }
    })
    this.get('/login', function (ctx) {
        setHeaderInfo(ctx);

        this.loadPartials(getPartials())
            .partial('./templates/actions/login.hbs');
    })
    this.post('/login', function (ctx) {
        setHeaderInfo(ctx);
        const { username, password } = ctx.params;
        if (username && password) {
            post('user', 'login', { username, password }, 'Basic')
                .then((userInfo) => {
                    displayLoading();
                    saveAuthInfo(userInfo);
                    ctx.redirect('/index.html');
                })
                .catch(console.error);
        }
    })
    this.get('/logout', function (ctx) {
        setHeaderInfo(ctx);

        post('user', '_logout', {}, 'Kinvey')
            .then(() => {
                sessionStorage.clear();
                ctx.redirect('/index.html');
            })
            .catch(console.error);
    })
    this.get('/create', function (ctx) {
        setHeaderInfo(ctx);

        this.loadPartials(getPartials())
            .partial('./templates/idea/create.hbs');
    })
    this.post('/create', function (ctx) {
        setHeaderInfo(ctx);
        const { title, description, imageURL } = ctx.params;

        post('appdata', 'ideas', {
            title,
            description,
            imageURL,
            creator: sessionStorage.getItem('username'),
            likes: 0,
            comments: []
        }).then(() => {
            displayLoading();
            ctx.redirect('/index.html');
        }).catch(console.error);
    })
    this.get('/details/:id', function (ctx) {
        setHeaderInfo(ctx);
        const id = ctx.params.id;

        get('appdata', `ideas/${id}`, 'Kinvey')
            .then((idea) => {
                ctx.idea = idea;
                ctx.isCreator = idea.creator === sessionStorage.getItem('username') ? true : false;
                this.loadPartials(getPartials())
                    .partial('../templates/idea/details.hbs')
            })
            .catch(console.error);
    })
    this.get('/comment/:id', async function (ctx) {
        setHeaderInfo(ctx);
        const id = ctx.params.id;
        const idea = await get('appdata', `ideas/${id}`, 'Kinvey');
        const comment = ctx.params.newComment;
        idea.comments.push(`${sessionStorage.getItem('username')} - ${comment}`);
        put('appdata', `ideas/${id}`, {
            title: idea.title,
            description: idea.description,
            imageURL: idea.imageURL,
            creator: idea.creator,
            likes: +idea.likes,
            comments: idea.comments
        }).then(() => {
            ctx.redirect('/index.html');
        }).catch(console.error);
    })
    this.get('/like/:id', async function (ctx) {
        setHeaderInfo(ctx);
        const id = ctx.params.id;
        const idea = await get('appdata', `ideas/${id}`, 'Kinvey');

        put('appdata', `ideas/${id}`, {
            title: idea.title,
            description: idea.description,
            imageURL: idea.imageURL,
            creator: idea.creator,
            likes: +idea.likes + 1,
            comments: idea.comments
        }).then(() => {
            ctx.redirect('/index.html');
        }).catch(console.error);
    })
    this.get('/delete/:id', function (ctx) {
        setHeaderInfo(ctx);
        const id = ctx.params.id;

        del('appdata', `ideas/${id}`, 'Kinvey')
            .then(() => {
                ctx.redirect('/index.html');
            })
            .catch(console.error);
    })
    this.get('/profile', async function (ctx) {
        setHeaderInfo(ctx);

        const allIdeas = await get('appdata', 'ideas', 'Kinvey');
        const ideas = allIdeas.filter(i => i.creator === sessionStorage.getItem('username')).map(x => x.title);
        const ideasCount = ideas.length;
        ctx.ideas = ideas;
        ctx.ideasCount = ideasCount;

        this.loadPartials(getPartials())
            .partial('./templates/profile.hbs');
    })
})
app.run();

function setHeaderInfo(ctx) {
    ctx.isLogged = sessionStorage.getItem('authtoken') !== null;
    ctx.username = sessionStorage.getItem('username');
}

function saveAuthInfo(userInfo) {
    sessionStorage.setItem('authtoken', userInfo._kmd.authtoken);
    sessionStorage.setItem('username', userInfo.username);
    sessionStorage.setItem('userId', userInfo._id);
}

function getPartials() {
    return {
        header: '../templates/common/header.hbs',
        footer: '../templates/common/footer.hbs',
        notLoggedHome: '../templates/notLoggedHome.hbs',
        dashboard: '../templates/dashboard.hbs'
    }
}

function displayLoading() {
    const element = document.getElementById('loadingBox');
    element.style.display = 'block';
    setTimeout(function () {
        element.style.display = 'none';
    }, 3000)
}