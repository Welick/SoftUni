import { get, put, post, del } from "./requester.js";

const app = Sammy('#container', function () {
    this.use('Handlebars', 'hbs');

    this.get('#/home', function (ctx) {
        setHeaderInfo(ctx);
        if (ctx.isLogged) {
            this.loadPartials(getPartials())
                .partial('../views/home.hbs');
        } else {
            this.loadPartials(getPartials())
                .partial('../views/home.hbs');
        }
    })
    this.get('#/register', function (ctx) {
        setHeaderInfo(ctx);
        this.loadPartials(getPartials())
            .partial('../views/actions/register.hbs');
    })
    this.post('#/register', function (ctx) {
        setHeaderInfo(ctx);
        const { username, password, repeatPassword } = ctx.params;

        if (username.length >= 3 && password.length >= 6 && password === repeatPassword) {
            post('user', '', { username, password }, 'Basic')
                .then((userInfo) => {
                    saveAuthInfo(userInfo);
                    ctx.redirect('#/home');
                })
                .catch(console.error)
        }
    })
    this.get('#/logout', function (ctx) {
        post('user', '_logout', {}, 'Kinvey')
            .then(() => {
                sessionStorage.clear();
                ctx.redirect('#/home')
            })
            .catch(console.error);
    })
    this.get('#/login', function (ctx) {
        setHeaderInfo(ctx);
        this.loadPartials(getPartials())
            .partial('../views/actions/login.hbs');
    })
    this.post('#/login', function (ctx) {
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
    this.get('#/cinema', function (ctx) {
        setHeaderInfo(ctx);
        get('appdata', 'movies', 'Kinvey')
            .then((movie) => {
                ctx.movies = movie.sort((a, b) => b.tickets - a.tickets);

                this.loadPartials(getPartials())
                    .partial('../views/films/cinema.hbs');
            })

    })
    this.get('#/addMovie', function (ctx) {
        setHeaderInfo(ctx);
        this.loadPartials(getPartials())
            .partial('../views/films/addMovie.hbs');
    })
    this.post('#/addMovie', function (ctx) {
        const { title, imageUrl, description, genres, tickets } = ctx.params;

        //if (title.length >= 6 && description.length >= 10 && imageUrl && genres && typeof tickets == 'number') {
        post('appdata', 'movies', {
            title,
            imageUrl,
            description,
            genres: genres.split(' ').join(','),
            tickets
        }).then(() => {
            ctx.redirect('#/home');
        })
            .catch(console.error);
        //}
    })
    this.get('#/buyTicket/:id', async function (ctx) {
        const id = ctx.params.id;
        setHeaderInfo(ctx);

        const movie = await get('appdata', `movies/${id}`, 'Kinvey');
        if (+movie.tickets > 0) {
            put('appdata', `movies/${id}`, {
                title: movie.title,
                imageUrl: movie.imageUrl,
                description: movie.description,
                genres: movie.genres,
                tickets: +movie.tickets - 1
            })
                .then(() => {
                    ctx.redirect('#/home');
                })
                .catch(console.error);
        } else {
            console.log('No more ticket');
        }
    })
    this.get('#/details/:id', function (ctx) {
        const id = ctx.params.id;
        setHeaderInfo(ctx);

        get('appdata', `movies/${id}`, 'Kinvey')
            .then(movie => {
                ctx.movie = movie;
                this.loadPartials(getPartials())
                    .partial('../views/films/details.hbs');
            })
            .catch(console.error);
    })
    this.get('#/myMovies', async function (ctx) {
        setHeaderInfo(ctx);
        const movies = await get('appdata', 'movies', 'Kinvey');
        const myMovies = movies.filter(m => m._acl.creator === sessionStorage.getItem('userId'));
        ctx.movies = myMovies;
        this.loadPartials(getPartials())
            .partial('../views/myMovies.hbs')
    })
    this.get('#/edit/:id', function (ctx) {
        const id = ctx.params.id;
        setHeaderInfo(ctx);
        get('appdata', `movies/${id}`, 'Kinvey')
            .then(movie => {
                ctx.movie = movie;
                this.loadPartials(getPartials())
                    .partial('../views/films/edit.hbs');
            })
            .catch(console.error);

    })
    this.post('#/edit/:id', function (ctx) {
        const id = ctx.params.id;
        const { title, imageUrl, description, genres, tickets } = ctx.params;
        put('appdata', `movies/${id}`, {
            title: title,
            imageUrl: imageUrl,
            description: description,
            genres: genres,
            tickets: tickets
        }).then(() => {
            ctx.redirect('#/home');
        }).catch(console.error);
    })
    this.get('#/delete/:id', function (ctx) {
        const id = ctx.params.id;
        setHeaderInfo(ctx);
        get('appdata', `movies/${id}`, 'Kinvey')
            .then((movie) => {
                ctx.movie = movie;
                this.loadPartials(getPartials())
                    .partial('../views/films/delete.hbs');
            })
            .catch(console.error);
    })
    this.post('#/delete/:id', function (ctx) {
        const id = ctx.params.id;
        setHeaderInfo(ctx);

        del('appdata', `movies/${id}`, 'Kinvey')
            .then(() => {
                ctx.redirect('#/home');
            })
            .catch(console.error);
    })
})
app.run();

function setHeaderInfo(ctx) {
    ctx.isLogged = sessionStorage.getItem('authtoken') !== null;
    ctx.username = sessionStorage.getItem('username');
}

function getPartials() {
    return {
        header: '../views/common/header.hbs',
        footer: '../views/common/footer.hbs'
    }
}

function saveAuthInfo(userInfo) {
    sessionStorage.setItem('userId', userInfo._id);
    sessionStorage.setItem('username', userInfo.username);
    sessionStorage.setItem('authtoken', userInfo._kmd.authtoken);
}