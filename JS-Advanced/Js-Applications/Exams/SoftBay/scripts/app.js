import { get, post, put, del } from "./requester.js";

const app = Sammy('body', function () {
    this.use("Handlebars", 'hbs');

    this.get('#/home', function (ctx) {
        setHeaderInfo(ctx);

        this.loadPartials(getPartials())
            .partial('./templates/home.hbs');
    })
    this.get('#/register', function (ctx) {
        setHeaderInfo(ctx);

        this.loadPartials(getPartials())
            .partial('./templates/user/register.hbs');
    })
    this.get('#/login', function (ctx) {
        setHeaderInfo(ctx);

        this.loadPartials(getPartials())
            .partial('./templates/user/login.hbs');
    })
    this.post('#/register', function (ctx) {
        setHeaderInfo(ctx);

        const { username, password, rePassword } = ctx.params;
        if (username && password && password === rePassword) {
            post('user', '', { username, password, buys: 0 }, 'Basic')
                .then((userInfo) => {
                    saveAuthInfo(userInfo);
                    ctx.redirect('#/home');
                }).catch(console.error);
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
                }).catch(console.error);
        }
    })
    this.get('#/logout', function (ctx) {
        setHeaderInfo(ctx);
        post('user', '_logout', {}, 'Kinvey')
            .then(() => {
                sessionStorage.clear();
                ctx.redirect('#/home');
            }).catch(console.error);
    })
    this.get('#/offer/create', function (ctx) {
        setHeaderInfo(ctx);

        this.loadPartials(getPartials())
            .partial('./templates/offer/create.hbs');
    })
    this.post('#/offer/create', function (ctx) {
        setHeaderInfo(ctx);

        const { product, description, price, pictureUrl } = ctx.params;
        if (product && description && price && pictureUrl.startsWith('http')) {
            post('appdata', 'offers', { product, description, price: +price, pictureUrl }, 'Kinvey')
                .then(() => {
                    ctx.redirect('#/home');
                }).catch(console.error);
        }
    })
    this.get('#/offer/all', async function (ctx) {
        setHeaderInfo(ctx);
        let count = 0;
        const offers = await get('appdata', 'offers', 'Kinvey');
        offers.map(x => x.isOwner = x._acl.creator === sessionStorage.getItem('userId') ? true : false);
        offers.map(x => x.count = count++);
        ctx.offers = offers;
        this.loadPartials(getPartials())
            .partial('./templates/offer/all.hbs');
    })
    this.get('#/offer/edit/:id', async function (ctx) {
        setHeaderInfo(ctx);
        const id = ctx.params.id;

        const offer = await get('appdata', `offers/${id}`, 'Kinvey');
        ctx.offer = offer;
        this.loadPartials(getPartials())
            .partial('../templates/offer/edit.hbs');
    })
    this.post('#/offer/edit/:id', function (ctx) {
        setHeaderInfo(ctx);
        const id = ctx.params.id;

        const { product, description, price, pictureUrl } = ctx.params;
        put('appdata', `offers/${id}`, {
            product: product,
            description: description,
            price: price,
            pictureUrl: pictureUrl
        }, 'Kinvey').then(() => {
            ctx.redirect('#/home');
        }).catch(console.error);
    })
    this.get('#/offer/delete/:id', async function (ctx) {
        setHeaderInfo(ctx);
        const id = ctx.params.id;

        const offer = await get('appdata', `offers/${id}`, 'Kinvey')
        ctx.offer = offer;
        this.loadPartials(getPartials())
            .partial('./templates/offer/delete.hbs');
    })
    this.post('#/offer/delete/:id', function (ctx) {
        setHeaderInfo(ctx);
        const id = ctx.params.id;

        del('appdata', `offers/${id}`, 'Kinvey')
            .then(() => {
                ctx.redirect('#/offer/all');
            }).catch(console.error);
    })
    this.get('#/offer/details/:id', async function (ctx) {
        setHeaderInfo(ctx);
        const id = ctx.params.id;
        const offer = await get('appdata', `offers/${id}`, 'Kinvey');
        ctx.offer = offer;
        this.loadPartials(getPartials())
            .partial('./templates/offer/details.hbs');
    })
    this.get('#/offer/buy', async function (ctx) {
        setHeaderInfo(ctx);
        const user = await get('user', sessionStorage.getItem('userId'), 'Kinvey');
        put('user', sessionStorage.getItem('userId'), {
            _id: user._id,
            username: user.username,
            buys: +user.buys + 1,
            _kmd: user._kmd,
            _acl: user._acl
        }).then(() =>
            ctx.redirect('#/home')
        )
            .catch(console.error);
        console.log(user);
    })
    this.get('#/profile',async function (ctx) {
        setHeaderInfo(ctx);
        const user = await get('user',sessionStorage.getItem('userId'),'Kinvey');
        ctx.buys = user.buys;
        this.loadPartials(getPartials())
            .partial('./templates/user/profile.hbs');
    })
})
app.run('#/home');

function setHeaderInfo(ctx) {
    ctx.isLogged = sessionStorage.getItem('authtoken') !== null;
    ctx.username = sessionStorage.getItem('username');
}

function saveAuthInfo(userInfo) {
    sessionStorage.setItem('authtoken', userInfo._kmd.authtoken);
    sessionStorage.setItem('username', userInfo.username);
    sessionStorage.setItem('userId', userInfo._id);
    sessionStorage.setItem('buys', userInfo.buys);
}

function getPartials() {
    return {
        header: '../templates/common/header.hbs',
        footer: '../templates/common/footer.hbs'
    }
}