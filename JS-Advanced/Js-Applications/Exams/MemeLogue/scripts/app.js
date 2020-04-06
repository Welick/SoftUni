import { get, post, put, del } from "./requester.js";

const app = Sammy('#container', function () {
    this.use('Handlebars', 'hbs');

    this.get('#/home', function (ctx) {
        setHeaderInfo(ctx);
        if (ctx.isLogged) {
            get('appdata', 'memes', 'Kinvey')
                .then((memes) => {
                    memes.map(x => x.isCreator = sessionStorage.getItem('userId') === x._acl.creator ? true : false);
                    memes.map(x => x.owner = x._acl.creator);
                    ctx.memes = memes;
                    this.loadPartials(getPartials())
                        .partial('./views/home/home.hbs');
                })
        } else {
            this.loadPartials(getPartials())
                .partial('./views/home/home.hbs');
        }
    })

    this.get('#/register', function (ctx) {
        setHeaderInfo(ctx);

        this.loadPartials(getPartials())
            .partial('./views/user/register.hbs');
    })

    this.get('#/login', function (ctx) {
        setHeaderInfo(ctx);

        this.loadPartials(getPartials())
            .partial('./views/user/login.hbs');
    })

    this.post('#/register', function (ctx) {
        setHeaderInfo(ctx);

        const { username, password, repeatPass, email, avatarUrl } = ctx.params;
        if (username && password && email && avatarUrl && password === repeatPass) {
            post('user', '', { username, password, email, avatarUrl }, 'Basic')
                .then((userInfo) => {
                    saveAuthInfo(userInfo);
                    ctx.redirect('#/home');
                })
                .catch(console.error);
        }
    })

    this.post('#/login', function (ctx) {
        setHeaderInfo(ctx);

        const { username, password } = ctx.params;
        if (username && password) {
            post('user', 'login', { username, password }, 'Basic')
                .then((userInfo) => {
                    saveAuthInfo(userInfo);
                    ctx.redirect('#/home');
                })
                .catch(console.error);
        }
    })

    this.get('#/logout', function (ctx) {
        setHeaderInfo(ctx);

        post('user', '_logout', {}, 'Kinvey')
            .then(() => {
                sessionStorage.clear();
                ctx.redirect('#/home');
            })
            .catch(console.error);
    })

    this.get('#/meme/create', function (ctx) {
        setHeaderInfo(ctx);

        this.loadPartials(getPartials())
            .partial('./views/meme/create.hbs');
    })

    this.post('#/meme/create', function (ctx) {
        setHeaderInfo(ctx);

        const { title, description, imageUrl } = ctx.params;

        post('appdata', 'memes', { title, description, imageUrl, creator: sessionStorage.getItem('username') }, 'Kinvey')
            .then(() => {
                ctx.redirect('#/home');
            })
            .catch(console.error);
    })

    this.get('#/meme/edit/:id', async function (ctx) {
        setHeaderInfo(ctx);
        const id = ctx.params.id;

        const meme = await get('appdata', `memes/${id}`, 'Kinvey');
        ctx.meme = meme;

        this.loadPartials(getPartials())
            .partial('./views/meme/edit.hbs');
    })

    this.post('#/meme/edit/:id', function (ctx) {
        setHeaderInfo(ctx);
        const id = ctx.params.id;
        const { title, description, imageUrl } = ctx.params;

        get('appdata', `memes/${id}`, 'Kinvey')
            .then((meme) => {
                put('appdata', `memes/${id}`, { title, description, imageUrl, creator: meme.creator }, 'Kinvey')
                    .then(() => {
                        ctx.redirect('#/home');
                    })
                    .catch(console.error);
            });
    })

    this.get('#/meme/delete/:id', function (ctx) {
        setHeaderInfo(ctx);
        const id = ctx.params.id;

        del('appdata', `memes/${id}`, 'Kinvey')
            .then(() => {
                ctx.redirect('#/home');
            })
            .catch(console.error);
    })

    this.get('#/user/profile/:id', async function (ctx) {
        setHeaderInfo(ctx);
        const id = ctx.params.id;

        const user = await get('user', id, 'Kinvey');
        const isThisProfileMine = user._acl.creator === sessionStorage.getItem('userId') ? true : false;
        const allMemes = await get('appdata', 'memes', 'Kinvey');
        const userMemes = allMemes.filter(x => x._acl.creator === user._acl.creator);
        userMemes.map(x => x.isMe = id === sessionStorage.getItem('userId') ? true : false);

        ctx.user = user;
        ctx.memes = userMemes;
        ctx.isThisProfileMine = isThisProfileMine;

        this.loadPartials(getPartials())
            .partial('./views/user/profile.hbs');
    })

    this.get('#/meme/details/:id', async function (ctx) {
        setHeaderInfo(ctx);
        const id = ctx.params.id;

        const meme = await get('appdata', `memes/${id}`, 'Kinvey');
        ctx.meme = meme;
        ctx.isCreator = meme.creator === sessionStorage.getItem('userId') ? true : false;
        ctx.creator = meme._acl.creator;

        this.loadPartials(getPartials())
            .partial('./views/meme/details.hbs');
    })

    this.get('#/profile/delete/:id', function (ctx) {
        // TODO
    })
})

app.run()

function setHeaderInfo(ctx) {
    ctx.isLogged = sessionStorage.getItem('authtoken') !== null;
    ctx.username = sessionStorage.getItem('username');
    ctx.userId = sessionStorage.getItem('userId');
}

function saveAuthInfo(userInfo) {
    sessionStorage.setItem('authtoken', userInfo._kmd.authtoken);
    sessionStorage.setItem('username', userInfo.username);
    sessionStorage.setItem('userId', userInfo._id);
}

function getPartials() {
    return {
        header: '../views/common/header.hbs',
        footer: '../views/common/footer.hbs'
    }
}