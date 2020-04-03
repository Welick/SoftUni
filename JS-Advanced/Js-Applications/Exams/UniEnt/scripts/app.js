import { get, post, put, del } from "./requester.js";

const app = Sammy('#container', function () {
    this.use('Handlebars', 'hbs');

    this.get('#/home', function (ctx) {
        setHeaderInfo(ctx);

        if (ctx.isLogged) {
            get('appdata', 'events', 'Kinvey')
                .then((events) => {
                    const sortedEvents = events.sort((a, b) => b.interested - a.interested);
                    ctx.events = sortedEvents;
                    this.loadPartials(getPartials())
                        .partial('./views/home/user-home.hbs');
                })
        } else {
            this.loadPartials(getPartials())
                .partial('./views/home/guest-home.hbs');
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
        const { username, password, rePassword } = ctx.params;

        if (username.length >= 3 && password.length >= 6 && password === rePassword) {
            post('user', '', { username, password }, 'Basic')
                .then(() => {
                    ctx.redirect('#/login');
                    showSuccess('User registration successful.');
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
                    showSuccess('Login successful.');
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
                showSuccess('Logout successful.');
            })
            .catch(console.error);
    })

    this.get('#/event/create', function (ctx) {
        setHeaderInfo(ctx);

        this.loadPartials(getPartials())
            .partial('./views/event/create-event.hbs');
    })

    this.post('#/event/create', function (ctx) {
        setHeaderInfo(ctx);

        const { name, dateTime, description, imageURL } = ctx.params;

        if (name.length >= 6 && dateTime && description.length >= 10 && imageURL.startsWith('http')) {
            post('appdata', 'events', {
                name, dateTime, description, imageURL,
                organizer: sessionStorage.getItem('username'),
                interested: 0
            })
                // Clean form || Redirect
                .then(() => {
                    ctx.redirect('#/home');
                    showSuccess('Event created successfully.');
                })
                .catch(console.error);
        }
    })

    this.get('#/event/details/:id', async function (ctx) {
        setHeaderInfo(ctx);
        const id = ctx.params.id;

        const event = await get('appdata', `events/${id}`, 'Kinvey');
        ctx.isOwner = event._acl.creator === sessionStorage.getItem('userId') ? true : false;
        ctx.event = event;
        this.loadPartials(getPartials())
            .partial('./views/event/details-event.hbs');
    })

    this.get('#/event/edit/:id', async function (ctx) {
        setHeaderInfo(ctx);
        const id = ctx.params.id;

        const event = await get('appdata', `events/${id}`, 'Kinvey');
        ctx.event = event;

        this.loadPartials(getPartials())
            .partial('./views/event/edit-event.hbs');
    })

    this.post('#/event/edit/:id', function (ctx) {
        setHeaderInfo(ctx);
        const id = ctx.params.id;

        get('appdata', `events/${id}`, 'Kinvey');
        const { name, dateTime, description, imageURL, organizer, peopleInterestedIn } = ctx.params;

        put('appdata', `events/${id}`, {
            name, dateTime, description, imageURL, organizer, interested: Number(peopleInterestedIn)
        }).then(() => {
            ctx.redirect('#/home');
            showSuccess('Event edited successfully.');
        })
            .catch(console.error);
    })

    this.get('#/event/join/:id', async function (ctx) {
        setHeaderInfo(ctx);
        const id = ctx.params.id;

        const event = await get('appdata', `events/${id}`, 'Kinvey');
        put('appdata', `events/${id}`, {
            name: event.name,
            dateTime: event.dateTime,
            description: event.description,
            imageURL: event.imageURL, organizer: event.organizer,
            interested: Number(event.interested) + 1
        }).then(() => {
            ctx.redirect('#/home');
            showSuccess('You join the event successfully.');
        })
            .catch(console.error);
    })

    this.get('#/event/close/:id', function (ctx) {
        setHeaderInfo(ctx);
        const id = ctx.params.id;

        del('appdata', `events/${id}`, 'Kinvey')
            .then(() => {
                ctx.redirect('#/home');
                showSuccess('Event closed successfully.');
            })
            .catch(console.error);
    })

    this.get('#/user/profile', async function (ctx) {
        setHeaderInfo(ctx);

        const allEvents = await get('appdata', 'events', 'Kinvey');
        const events = allEvents.filter(x => x._acl.creator === sessionStorage.getItem('userId')).map(x => x.name);
        ctx.events = events;
        ctx.eventsCount = events.length;

        this.loadPartials(getPartials())
            .partial('./views/user/profile.hbs');
    })
})
app.run();

function getPartials() {
    return {
        header: './views/common/header.hbs',
        footer: './views/common/footer.hbs'
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

function showSuccess(message) {
    let element = document.querySelector('#successBox');
    element.textContent = message;
    setTimeout(() => element.style.display = 'block', 500);
    element.addEventListener('click', () => element.style.display = 'none');
    setTimeout(() => element.style.display = 'none', 5000);
}