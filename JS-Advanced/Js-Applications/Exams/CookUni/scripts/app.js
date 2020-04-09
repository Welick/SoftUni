import { get, put, post, del } from "./requester.js";
import * as authHandler from './handlers/auth-handler.js';
import { setHeaderInfo, getPartials } from "./shared.js";


const app = Sammy('#rooter', function () {
    this.use('Handlebars', 'hbs');

    this.get('/', function (ctx) {
        setHeaderInfo(ctx);
        if (ctx.isAuth) {
            get('appdata', 'recipes', 'Kinvey')
                .then((recipes) => {
                    ctx.recipes = recipes;

                    this.loadPartials(getPartials())
                        .partial('./views/home.hbs');
                })
                .catch(console.error);
        } else {
            this.loadPartials(getPartials())
                .partial('./views/home.hbs');
        }
    });

    this.get('/register', authHandler.getRegister);

    this.post('/register', authHandler.postRegister);

    this.get('/login', authHandler.getLogin);

    this.post('/login', authHandler.postLogin);

    this.get('/logout', authHandler.logout);

    this.get('/share', function (ctx) {
        setHeaderInfo(ctx);
        this.loadPartials(getPartials())
            .partial('./views/recipe/share.hbs');
    });
    this.post('/share', function (ctx) {
        const { meal, ingredients, prepMethod, description, foodImageURL, category } = ctx.params;
        const categories = {
            'Vegetables and legumes/beans': 'https://t3.ftcdn.net/jpg/00/25/90/48/240_F_25904887_fhZJ692ukng3vQxzHldvuN981OiYVlJ1.jpg',
            'Fruits': 'https://cdn.pixabay.com/photo/2017/06/02/18/24/fruit-2367029__340.jpg',
            'Grain Food': 'https://cdn.pixabay.com/photo/2014/12/11/02/55/corn-syrup-563796__340.jpg',
            'Milk, cheese, eggs and alternatives': 'https://image.shutterstock.com/image-photo/assorted-dairy-products-milk-yogurt-260nw-530162824.jpg',
            'Lean meats and poultry, fish and alternative': 'https://t3.ftcdn.net/jpg/01/18/84/52/240_F_118845283_n9uWnb81tg8cG7Rf9y3McWT1DT1ZKTDx.jpg'
        };
        if (meal && ingredients && prepMethod && description && foodImageURL && category) {
            post('appdata', 'recipes', {
                meal,
                ingredients: ingredients.split(' '),
                prepMethod,
                description,
                foodImageURL,
                category,
                likesCounter: 0,
                categoryImageURL: categories[category]
            }).then(() => {
                ctx.redirect('/');
            }).catch(console.error);
        }
    });
    this.get('/recipe/:id', function (ctx) {
        const id = ctx.params.id;
        setHeaderInfo(ctx);

        get('appdata', `recipes/${id}`, 'Kinvey')
            .then(recipe => {
                recipe.isCreator = sessionStorage.getItem('userId') === recipe._acl.creator;
                ctx.recipe = recipe;
                this.loadPartials(getPartials())
                    .partial('../views/recipe/recipe-details.hbs')
            })
            .catch(console.error);
    });
    this.get('/edit/:id', function (ctx) {
        const id = ctx.params.id;
        setHeaderInfo(ctx);

        get('appdata', `recipes/${id}`, 'Kinvey')
            .then(recipe => {
                recipe.ingredients = recipe.ingredients.join(' ');
                ctx.recipe = recipe;

                this.loadPartials(getPartials())
                    .partial('../views/recipe/recipe-edit.hbs');
            })
            .catch(console.error);
    });
    this.post('/edit/:id', function (ctx) {
        const id = ctx.params.id;
        const { meal, ingredients, prepMethod, description, foodImageURL, category } = ctx.params;
        const categories = {
            'Vegetables and legumes/beans': 'https://t3.ftcdn.net/jpg/00/25/90/48/240_F_25904887_fhZJ692ukng3vQxzHldvuN981OiYVlJ1.jpg',
            'Fruits': 'https://cdn.pixabay.com/photo/2017/06/02/18/24/fruit-2367029__340.jpg',
            'Grain Food': 'https://cdn.pixabay.com/photo/2014/12/11/02/55/corn-syrup-563796__340.jpg',
            'Milk, cheese, eggs and alternatives': 'https://image.shutterstock.com/image-photo/assorted-dairy-products-milk-yogurt-260nw-530162824.jpg',
            'Lean meats and poultry, fish and alternatives': 'https://t3.ftcdn.net/jpg/01/18/84/52/240_F_118845283_n9uWnb81tg8cG7Rf9y3McWT1DT1ZKTDx.jpg'
        };
        put('appdata', `recipes/${id}`, {
            meal,
            ingredients: ingredients.split(' '),
            prepMethod,
            description,
            foodImageURL,
            category,
            categoryImageURL: categories[category]
        }).then(() => {
            ctx.redirect('/');
        }).catch(console.error);
    });
    this.get('/like/:id', async function (ctx) {
        const id = ctx.params.id;
        setHeaderInfo(ctx);

        const recipe = await get('appdata', `recipes/${id}`, 'Kinvey');

        put('appdata', `recipes/${id}`, {
            meal: recipe.meal,
            ingredients: recipe.ingredients,
            prepMethod: recipe.prepMethod,
            description: recipe.description,
            foodImageURL: recipe.foodImageURL,
            category: recipe.category,
            likesCounter: recipe.likesCounter + 1,
            categoryImageURL: recipe.categoryImageURL
        })
            .then(() => {
                ctx.redirect('/');
            })
            .catch(console.error);
    });
    this.get('/archive/:id', function (ctx) {
        setHeaderInfo(ctx);
        const id = ctx.params.id;

        //const recipe = await get('appdata', `recipes/${id}`, 'Kinvey');

        del('appdata', `recipes/${id}`, 'Kinvey')
            .then(() => {
                ctx.redirect('/');
            })
            .catch(console.error);
    });
});
app.run();