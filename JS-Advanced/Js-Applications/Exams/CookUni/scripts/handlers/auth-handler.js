import { get, put, post, del } from "../requester.js";
import { getPartials, setHeaderInfo, displayError, displaySuccess } from "../shared.js";

function saveAuthInfo(userInfo) {
    sessionStorage.setItem('authtoken', userInfo._kmd.authtoken);
    sessionStorage.setItem('fullName', userInfo.firstName + ' ' + userInfo.lastName);
    sessionStorage.setItem('userId', userInfo._id);
}

export function getRegister(ctx) {
    setHeaderInfo(ctx);
    this.loadPartials(getPartials())
        .partial('./views/auth/register.hbs');
}
export function postRegister(ctx) {
    const { firstName, lastName, username, password, repeatPassword } = ctx.params;

    if (firstName && lastName && username && password && password === repeatPassword) {
        post('user', '', { firstName, lastName, username, password }, 'Basic')
            .then((userInfo) => {
                saveAuthInfo(userInfo);
                displaySuccess('User registration successful...');
                //setTimeout(() => {
                ctx.redirect('/');
                //}, 5000)
            })
            .catch(() => displayError('Something went wrong!'));
    }
}
export function getLogin(ctx) {
    setHeaderInfo(ctx);
    this.loadPartials(getPartials())
        .partial('./views/auth/login.hbs');
}
export function postLogin(ctx) {
    const { username, password } = ctx.params;
    if (username && password) {
        post('user', 'login', { username, password }, 'Basic')
            .then((userInfo) => {
                saveAuthInfo(userInfo);
                ctx.redirect('/');
            })
            .catch(console.error);
    }
}
export function logout(ctx) {
    post('user', '_logout', {}, 'Kinvey')
        .then(() => {
            sessionStorage.clear();
            ctx.redirect('/');
        })
        .catch(console.error);
}