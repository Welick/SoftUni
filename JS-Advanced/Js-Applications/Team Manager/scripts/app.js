import { get, put, post, del } from "./requester.js";

const app = Sammy('#main', function () {

    const partials = {
        header: '../templates/common/header.hbs',
        footer: '../templates/common/footer.hbs'
    }


    this.use('Handlebars', 'hbs');
    
    // Страница при вход
    this.get('#/home', function (ctx) {
        setHeaderInfo(ctx);
        this.loadPartials(partials)
            .partial('./templates/home/home.hbs');
    })
    // Регистрация - форма
    this.get('#/register', function (ctx) {
        setHeaderInfo(ctx);
        partials['registerForm'] = '../templates/register/registerForm.hbs';
        this.loadPartials(partials)
            .partial('./templates/register/registerPage.hbs')
    })
    // Регистрация - изпращане на информация + автоматичен login
    this.post('#/register', function (ctx) {
        setHeaderInfo(ctx);
        const { username, password, repeatPassword } = ctx.params;
        if (username && password && password === repeatPassword) {
            post('user', '', { username, password }, 'Basic')
                .then((userInfo) => {
                    saveAuthInfo(userInfo);
                    ctx.redirect('#/home')
                })
                .catch(console.error);
        }
    })
    // Излизане от профила + изчистване на session storage
    this.get('#/logout', function (ctx) {
        setHeaderInfo(ctx);

        post('user', '_logout', {}, 'Kinvey')
            .then(() => {
                sessionStorage.clear();
                ctx.redirect('#/home')
            })
            .catch(console.error);
    })
    // Влизане в профил - форма
    this.get('#/login', function (ctx) {
        setHeaderInfo(ctx);
        partials['loginForm'] = '../templates/login/loginForm.hbs';
        this.loadPartials(partials)
            .partial('../templates/login/loginPage.hbs');
    })
    // Влизане в профил
    this.post('#/login', function (ctx) {
        setHeaderInfo(ctx);
        const { username, password } = ctx.params;
        post('user', 'login', { username, password }, 'Basic')
            .then((userInfo) => {
                saveAuthInfo(userInfo);
                ctx.redirect('#/home');
            })
            .catch(console.error);
    })
    // Каталог на всички отбори
    this.get('#/catalog', function (ctx) {
        setHeaderInfo(ctx);
        partials['team'] = '../templates/catalog/team.hbs';
        get('appdata', 'teams', 'Kinvey')
            .then((data) => {
                ctx.teams = data;
                ctx.hasNoTeam = true;
                data.forEach(x => {
                    const members = x.members;
                    if (members.includes(sessionStorage.getItem('username'))) {
                        ctx.hasNoTeam = false;
                    }
                })
                this.loadPartials(partials)
                    .partial('../templates/catalog/teamCatalog.hbs');
            })
            .catch(console.error);
    })
    // Форма за създаване на отбор
    this.get('#/create', function (ctx) {
        setHeaderInfo(ctx);
        partials['createForm'] = '../templates/create/createForm.hbs';
        this.loadPartials(partials)
            .partial('../templates/create/createPage.hbs');
    })
    // Създаване на отбора + автоматичко присъединяване към него
    this.post('#/create', function (ctx) {
        setHeaderInfo(ctx);
        const { name, comment } = ctx.params;
        post('appdata', 'teams', { name, comment, members: [sessionStorage.getItem('username')] }, 'Kinvey')
            .then(() => {
                ctx.redirect('#/home');
            })
            .catch(console.error);
    })
    // Детайли за конкретен отбор
    this.get('#/catalog/:id', async function (ctx) {
        setHeaderInfo(ctx);
        const id = ctx.params.id;
        partials['teamMember'] = './templates/catalog/teamMember.hbs';
        partials['teamControls'] = './templates/catalog/teamControls.hbs';
        const teams = await get('appdata', 'teams', 'Kinvey');

        get('appdata', `teams/${id}`, 'Kinvey')
            .then((teamInfo) => {
                ctx.team = teamInfo;
                ctx.name = teamInfo.name;
                ctx.comment = teamInfo.comment;
                ctx.isAuthor = teamInfo._acl.creator === sessionStorage.getItem('userId') ? true : false;
                ctx.hasNoTeam = true;
                teams.forEach(x => {
                    const members = x.members;
                    if (members.includes(sessionStorage.getItem('username'))) {
                        ctx.hasNoTeam = false;
                    }
                })
                if (teamInfo.members.length > 0) {
                    ctx.isOnTeam = (teamInfo.members).find(x => x === sessionStorage.getItem('username'));
                }

                this.loadPartials(partials)
                    .partial('../templates/catalog/details.hbs');
            })
            .catch(console.error);
    })
    // Форма за edit-ване на конкретен отбор
    this.get('#/edit/:id', async function (ctx) {
        setHeaderInfo(ctx);
        const id = ctx.params.id;
        partials['editForm'] = './templates/edit/editForm.hbs';

        const team = await get('appdata', `teams/${id}`, 'Kinvey');
        ctx.team = team;

        this.loadPartials(partials)
            .partial('../templates/edit/editPage.hbs')
    })
    // Изпращане на put заявка която ъпгрейдва информацията за отбора
    this.post('#/edit/:id', function (ctx) {
        setHeaderInfo(ctx);
        const id = ctx.params.id;
        const { name, comment } = ctx.params;

        get('appdata', `teams/${id}`, 'Kinvey')
            .then((team) => {
                ctx.team = team;
                put('appdata', `teams/${id}`, {
                    name: name, comment: comment, members: team.members
                }).then(() => ctx.redirect('#/home'))
                    .catch(console.error);
            })

    })
    // Присъединяване към конкретен отбор
    this.get('#/join/:id', async function (ctx) {
        const id = ctx.params.id;
        ctx._id = id;

        const team = await get('appdata', `teams/${id}`, 'Kinvey');
        ctx.team = team;
        const teamArr = team.members;
        const name = sessionStorage.getItem('username');
        teamArr.push(name);

        put('appdata', `teams/${id}`, {
            name: team.name,
            comment: team.comment,
            members: teamArr
        })
            .then(() => {
                ctx.redirect('#/home')
            })
            .catch(console.error);
    })
    // Напускане на отбор
    this.get('#/leave/:id', async function (ctx) {
        setHeaderInfo(ctx);
        const id = ctx.params.id;

        const team = await get('appdata', `teams/${id}`, 'Kinvey');
        const index = team.members.findIndex(x => x === sessionStorage.getItem('username'));
        team.members.splice(index, 1);
        put('appdata', `teams/${id}`, {
            name: team.name, comment: team.comment, members: team.members
        }).then(() => ctx.redirect('#/home'))
            .catch(console.error);
    })
})
app.run();

function setHeaderInfo(ctx) {
    ctx.loggedIn = sessionStorage.getItem('authtoken') !== null;
    ctx.username = sessionStorage.getItem('username');
    ctx.userId = sessionStorage.getItem('userId');
}

function saveAuthInfo(userInfo) {
    sessionStorage.setItem('authtoken', userInfo._kmd.authtoken);
    sessionStorage.setItem('username', userInfo.username);
    sessionStorage.setItem('userId', userInfo._id);
}