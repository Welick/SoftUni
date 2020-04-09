export function getPartials() {
    return {
        header: './views/common/header.hbs',
        footer: './views/common/footer.hbs'
    };
}

export function setHeaderInfo(ctx) {
    ctx.isAuth = sessionStorage.getItem('authtoken') !== null;
    ctx.fullName = sessionStorage.getItem('fullName');
}

export function displayError(message) {
    const errorBox = document.getElementById('errorBox');
    errorBox.textContent = message;
    errorBox.style.display = 'block';
    setTimeout(() => {
        errorBox.style.display = 'none'
    }, 2000);
}
export function displaySuccess(message) {
    const successBox = document.getElementById('successBox');
    successBox.textContent = message;
    successBox.style.display = 'block';
    setTimeout(() => {
        successBox.style.display = 'none'
    }, 5000);
}