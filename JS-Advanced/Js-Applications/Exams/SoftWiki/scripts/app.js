import { get, post, put, del } from "./requester.js";

const app = Sammy('#root', function () {
    this.use('Handlebars', 'hbs');

    // Ако user-а е log-нат показваме homepage, ако не е показваме login форма.
    // Правим сортиране на articles по нисходящ ред спрамо title
    this.get('#/home', function (ctx) {
        setHeaderInfo(ctx);

        if (ctx.isLogged) {
            get('appdata', 'articles', 'Kinvey')
                .then((articles) => {
                    articles = articles.sort((a, b) => b.title.localeCompare(a.title));
                    ctx.jsArticles = articles.filter(x => x.category === 'JavaScript');
                    ctx.csharpArticles = articles.filter(x => x.category === 'CSharp');
                    ctx.javaArticles = articles.filter(x => x.category === 'Java');
                    ctx.pythonArticles = articles.filter(x => x.category === 'Python');

                    this.loadPartials(getPartials())
                        .partial('./views/home/home.hbs');
                })
        } else {
            this.loadPartials(getPartials())
                .partial('./views/user/login.hbs');
        }

    })

    // Форма за регистрация, успешно регистриралите се автоматичко се log-ват и redirect-ват към home с articles
    this.get('#/register', function (ctx) {
        setHeaderInfo(ctx);

        this.loadPartials(getPartials())
            .partial('./views/user/register.hbs');
    })

    this.post('#/register', function (ctx) {
        setHeaderInfo(ctx);

        const { username, password, rePassword } = ctx.params;

        if (username && password && password === rePassword) {
            post('user', '', { username, password }, 'Basic')
                .then((userInfo) => {
                    saveAuthInfo(userInfo);
                    ctx.redirect('#/home');
                })
                .catch(console.error);
        }
    })

    // Форма за влизане в профил, успешно влизане в профил redirect-ва към home с articles
    this.get('#/login', function (ctx) {
        setHeaderInfo(ctx);

        this.loadPartials(getPartials())
            .partial('./views/user/login.hbs');
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

    // Излизане от профил, изтриваме сесията от sessionStorage, redirect към home страница (тоест към login понеже не сме log-нати)
    this.get('#/logout', function (ctx) {
        setHeaderInfo(ctx);

        post('user', '_logout', {}, 'Kinvey')
            .then(() => {
                sessionStorage.clear();
                // В този случай home е login формата
                ctx.redirect('#/home');
            })
            .catch(console.error);
    })

    // Създаваме article, като добавяме и creator property, redirect към home страницата
    this.get('#/create', function (ctx) {
        setHeaderInfo(ctx);

        this.loadPartials(getPartials())
            .partial('./views/article/create-article.hbs');
    })

    this.post('#/create', function (ctx) {
        setHeaderInfo(ctx);

        const { title, category, content } = ctx.params;

        if (title && category && content) {
            post('appdata', 'articles', {
                title, category, content, creator: sessionStorage.getItem('username')
            })
                .then(() => ctx.redirect('#/home'))
                .catch(console.error);
        }
    })

    // Показваме details формата, с различни бутони в зависимост от това дали сме автор на article-а или не
    this.get('#/details/:id', function (ctx) {
        setHeaderInfo(ctx);
        const id = ctx.params.id;

        get('appdata', `articles/${id}`, 'Kinvey')
            .then((article) => {
                ctx.article = article;
                ctx.isCreator = article._acl.creator === sessionStorage.getItem('userId') ? true : false;
                this.loadPartials(getPartials())
                    .partial('./views/article/details.hbs');
            })
    })

    // Редактираме article и правим redirect към home страницата
    this.get('#/edit/:id', function (ctx) {
        setHeaderInfo(ctx);
        const id = ctx.params.id;

        get('appdata', `articles/${id}`, 'Kinvey')
            .then((article) => {
                ctx.article = article;
                this.loadPartials(getPartials())
                    .partial('./views/article/edit.hbs');
            })
            .catch(console.error);
    })

    this.post('#/edit/:id', function (ctx) {
        setHeaderInfo(ctx);
        const id = ctx.params.id;
        const { title, category, content } = ctx.params;

        if (title && category && content) {
            get('appdata', `articles/${id}`, 'Kinvey')
                .then((article) => {
                    put('appdata', `articles/${id}`, {
                        title, category, content, creator: article.creator
                    })
                        .then(() => ctx.redirect('#/home'))
                        .catch(console.error);
                }).catch(console.error);
        }
    })

    // Изтриваме article и правим redirect към home страницата
    this.get('#/delete/:id', function (ctx) {
        setHeaderInfo(ctx);
        const id = ctx.params.id;

        del('appdata', `articles/${id}`, 'Kinvey')
            .then(() => {
                ctx.redirect('#/home');
            })
            .catch(console.error);
    })
})
app.run();

function getPartials() {
    return {
        header: './views/common/header.hbs',
        footer: './views/common/footer.hbs',
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