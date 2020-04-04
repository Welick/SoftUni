import { post, put, get, del } from "./requester.js";

const app = Sammy('#container', function () {
    this.use('Handlebars', 'hbs');

    // Same for home and all songs
    this.get('/index.html', function (ctx) {
        setHeaderInfo(ctx);

        if (ctx.isLogged) {
            get('appdata', 'songs', 'Kinvey')
                .then((songs) => {
                    songs.map((song) => song.isAuthor = song._acl.creator === sessionStorage.getItem('userId'));
                    ctx.songs = songs;
                    this.loadPartials(getPartials())
                        .partial('../views/home.hbs');
                })
        } else {
            this.loadPartials(getPartials())
                .partial('../views/home.hbs');
        }
    })
    
    this.get('/register', function (ctx) {
        setHeaderInfo(ctx);

        this.loadPartials(getPartials())
            .partial('../views/actions/register.hbs');
    })
    this.post('/register', function (ctx) {
        setHeaderInfo(ctx);
        const { username, password } = ctx.params;
        if (username.length >= 3 && password.length >= 6) {
            post('user', '', { username, password }, 'Basic')
                .then((userInfo) => {
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
    this.get('/login', function (ctx) {
        setHeaderInfo(ctx);

        this.loadPartials(getPartials())
            .partial('../views/actions/login.hbs');
    })
    this.post('/login', function (ctx) {
        setHeaderInfo(ctx);

        const { username, password } = ctx.params;
        post('user', 'login', { username, password }, 'Basic')
            .then((userInfo) => {
                saveAuthInfo(userInfo);
                ctx.redirect('/index.html');
            })
            .catch(console.error);
    })

    this.get('/create', function (ctx) {
        setHeaderInfo(ctx);

        this.loadPartials(getPartials())
            .partial('../views/songs/create.hbs');
    })
    this.post('/create', function (ctx) {
        setHeaderInfo(ctx);
        const { title, artist, imageURL } = ctx.params;
        post('appdata', 'songs', {
            title,
            artist,
            imageURL,
            likes: 0,
            listened: 0
        })
            .then(() => {
                ctx.redirect('/index.html')
            })
            .catch(console.error);
    })
    this.get('/like/:id', async function (ctx) {
        setHeaderInfo(ctx);
        const id = ctx.params.id;
        const song = await get('appdata', `songs/${id}`, 'Kinvey');

        put('appdata', `songs/${id}`, {
            title: song.title,
            artist: song.artist,
            imageURL: song.imageURL,
            likes: +song.likes + 1,
            listened: +song.listened
        })
            .then(() => {
                ctx.redirect('/index.html');
            })
            .catch(console.error);
    })
    this.get('/listen/:id', async function (ctx) {
        setHeaderInfo(ctx);
        const id = ctx.params.id;
        const song = await get('appdata', `songs/${id}`, 'Kinvey');
        put('appdata', `songs/${id}`, {
            title: song.title,
            artist: song.artist,
            imageURL: song.imageURL,
            likes: +song.likes,
            listened: +song.listened + 1
        })
            .then(() => {
                ctx.redirect('/index.html');
            })
            .catch(console.error);
    })
    this.get('/remove/:id', function (ctx) {
        setHeaderInfo(ctx);
        const id = ctx.params.id;

        del('appdata', `songs/${id}`, 'Kinvey')
            .then(() => {
                ctx.redirect('/index.html');
            })
            .catch(console.error);
    })
    this.get('/mySongs', async function (ctx) {
        setHeaderInfo(ctx);

        const songs = await get('appdata', 'songs', 'Kinvey');

        const ownSongs = songs.filter(x => x._acl.creator === sessionStorage.getItem('userId'));
        ownSongs.sort((a, b) => b.likes - a.likes || b.listened - a.listened);
        ctx.ownSongs = ownSongs;

        this.loadPartials(getPartials())
            .partial('../views/mySongs.hbs');
    })
})
app.run();

function getPartials() {
    return {
        header: '../views/common/header.hbs',
        footer: '../views/common/footer.hbs',
        allSongs: '../views/allSongs.hbs'
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