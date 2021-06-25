module.exports = function(app){
    const like = require('../controllers/likeController');
    const jwtMiddleware = require('../../../config/jwtMiddleware');

    app.patch('/items/likes', jwtMiddleware, like.setLikeItem);
    app.get('/items/likes',jwtMiddleware,like.getLikeItem);

    app.patch('/users/likes',jwtMiddleware, like.setLikeUser);
    app.get('/users/likes',jwtMiddleware,like.getLikeUser);
};
