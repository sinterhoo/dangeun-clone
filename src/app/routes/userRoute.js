module.exports = function(app){
    const user = require('../controllers/userController');
    const jwtMiddleware = require('../../../config/jwtMiddleware');

    app.post('/sms', user.send);
    app.post('/users/login', user.login);

    app.get('/check', jwtMiddleware, user.check);

    app.get('/users/:userId', jwtMiddleware, user.get);
    app.patch('/users/:userId/edit', jwtMiddleware, user.edit);
    app.patch('/users/:userId/ìnactivity', jwtMiddleware, user.delete);


    app.get('/tests',  user.getTest);
};
