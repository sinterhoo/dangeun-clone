module.exports = function(app){
    const naver = require('../controllers/naverController');


    app.get('/users/naver/logins', naver.login);

    app.get('/call-back', naver.callback);

    app.get('/users/naver/login', naver.member);
};