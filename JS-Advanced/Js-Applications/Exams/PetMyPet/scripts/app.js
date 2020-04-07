import { get, post, put, del } from "./requester.js";

const app = Sammy('#container', function () {
    this.use('Handlebars', 'hbs');

    this.get('#/home', function (ctx) {
        setHeaderInfo(ctx);
        if (ctx.isLogged) {
            get('appdata', 'pets', 'Kinvey')
                .then((answer) => {
                    ctx.pets = answer.filter(x => x._acl.creator !== sessionStorage.getItem('userId'));
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

    this.post('#/register', function (ctx) {
        setHeaderInfo(ctx);
        const { username, password } = ctx.params;

        if (username.length >= 3 && password.length >= 6) {
            post('user', '', { username, password }, 'Basic')
                .then((userInfo) => {
                    saveAuthInfo(userInfo);
                    ctx.redirect('#/home');
                })
                .catch(console.error);
        }
    })

    this.get('#/login', function (ctx) {
        setHeaderInfo(ctx);

        this.loadPartials(getPartials())
            .partial('./views/user/login.hbs');
    })

    this.post('#/login', function (ctx) {
        setHeaderInfo(ctx);
        const { username, password } = ctx.params;

        if (username.length >= 3 && password.length >= 6) {
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

    this.get('#/pet/create', function (ctx) {
        setHeaderInfo(ctx);

        this.loadPartials(getPartials())
            .partial('./views/pet/create-pet.hbs');
    })

    this.post('#/pet/create', function (ctx) {
        setHeaderInfo(ctx);

        const { name, description, imageURL, category } = ctx.params;

        if (name && description && imageURL && category) {
            post('appdata', 'pets', { name, description, imageURL, category, likes: 0 })
                .then(() => {
                    ctx.redirect('#/home');
                })
                .catch(console.error);
        }
    })

    this.get('#/user/pets', async function (ctx) {
        setHeaderInfo(ctx);

        const allPets = await get('appdata', 'pets', 'Kinvey');
        ctx.pets = allPets.filter(x => x._acl.creator === sessionStorage.getItem('userId'));
        this.loadPartials(getPartials())
            .partial('./views/pet/my-pet.hbs');
    })

    this.get('#/pet/edit/:id', function (ctx) {
        setHeaderInfo(ctx);
        const id = ctx.params.id;

        get('appdata', `pets/${id}`, 'Kinvey')
            .then((pet) => {
                ctx.pet = pet;
                this.loadPartials(getPartials())
                    .partial('./views/pet/edit-pet.hbs');
            })
    })

    this.post('#/pet/edit/:id', function (ctx) {
        setHeaderInfo(ctx);
        const id = ctx.params.id;
        const { description } = ctx.params;

        get('appdata', `pets/${id}`, 'Kinvey')
            .then((pet) => {
                put('appdata', `pets/${id}`, {
                    name: pet.name,
                    description,
                    category: pet.category,
                    imageURL: pet.imageURL,
                    likes: +(pet.likes)
                }).then(() => ctx.redirect('#/home'))
                    .catch(console.error);
            }).catch(console.error);
    })

    this.get('#/pet/details/:id', function (ctx) {
        setHeaderInfo(ctx);
        const id = ctx.params.id;

        get('appdata', `pets/${id}`, 'Kinvey')
            .then((pet) => {
                ctx.pet = pet;
                this.loadPartials(getPartials())
                    .partial('./views/pet/details-pet.hbs');
            })
            .catch(console.error);
    })

    this.get('#/pet/pet/:id', function (ctx) {
        setHeaderInfo(ctx);
        const id = ctx.params.id;

        get('appdata', `pets/${id}`, 'Kinvey')
            .then((pet) => {
                put('appdata', `pets/${id}`, {
                    name: pet.name,
                    description: pet.description,
                    category: pet.category,
                    imageURL: pet.imageURL,
                    likes: +(pet.likes) + 1
                }).then(() => ctx.redirect('#/home'))
                    .catch(console.error);
            })
            .catch(console.error);
    })

    this.get('#/pet/delete/:id', function (ctx) {
        setHeaderInfo(ctx);
        const id = ctx.params.id;

        get('appdata', `pets/${id}`, 'Kinvey')
            .then((pet) => {
                ctx.pet = pet;
                this.loadPartials(getPartials())
                    .partial('./views/pet/delete-pet.hbs');
            })
            .catch(console.error);
    })

    this.post('#/pet/delete/:id', function (ctx) {
        setHeaderInfo(ctx);
        const id = ctx.params.id;

        del('appdata', `pets/${id}`, 'Kinvey')
            .then(() => {
                ctx.redirect('#/home');
            })
            .catch(console.error);
    })

    this.get('#/home/others', function (ctx) {
        setHeaderInfo(ctx);

        get('appdata', 'pets', 'Kinvey')
            .then((answer) => {
                let otherPets = answer.filter(x => x._acl.creator !== sessionStorage.getItem('userId'));
                otherPets = otherPets.sort((a, b) => b.likes - a.likes);
                ctx.pets = otherPets.filter(x => x.category === 'Other');
                this.loadPartials(getPartials())
                    .partial('./views/home/home.hbs');
            }).catch(console.error);
    })

    this.get('#/home/reptiles', function (ctx) {
        setHeaderInfo(ctx);

        get('appdata', 'pets', 'Kinvey')
            .then((answer) => {
                let otherPets = answer.filter(x => x._acl.creator !== sessionStorage.getItem('userId'));
                otherPets = otherPets.sort((a, b) => b.likes - a.likes);
                ctx.pets = otherPets.filter(x => x.category === 'Reptile');
                this.loadPartials(getPartials())
                    .partial('./views/home/home.hbs');
            }).catch(console.error);
    })

    this.get('#/home/parrots', function (ctx) {
        setHeaderInfo(ctx);

        get('appdata', 'pets', 'Kinvey')
            .then((answer) => {
                let otherPets = answer.filter(x => x._acl.creator !== sessionStorage.getItem('userId'));
                otherPets = otherPets.sort((a, b) => b.likes - a.likes);
                ctx.pets = otherPets.filter(x => x.category === 'Parrot');
                this.loadPartials(getPartials())
                    .partial('./views/home/home.hbs');
            }).catch(console.error);
    })

    this.get('#/home/dogs', function (ctx) {
        setHeaderInfo(ctx);

        get('appdata', 'pets', 'Kinvey')
            .then((answer) => {
                let otherPets = answer.filter(x => x._acl.creator !== sessionStorage.getItem('userId'));
                otherPets = otherPets.sort((a, b) => b.likes - a.likes);
                ctx.pets = otherPets.filter(x => x.category === 'Dog');
                this.loadPartials(getPartials())
                    .partial('./views/home/home.hbs');
            }).catch(console.error);
    })

    this.get('#/home/cats', function (ctx) {
        setHeaderInfo(ctx);

        get('appdata', 'pets', 'Kinvey')
            .then((answer) => {
                let otherPets = answer.filter(x => x._acl.creator !== sessionStorage.getItem('userId'));
                otherPets = otherPets.sort((a, b) => b.likes - a.likes);
                ctx.pets = otherPets.filter(x => x.category === 'Cat');
                this.loadPartials(getPartials())
                    .partial('./views/home/home.hbs');
            }).catch(console.error);
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
        header: '../views/common/header.hbs',
        footer: '../views/common/footer.hbs'
    }
}