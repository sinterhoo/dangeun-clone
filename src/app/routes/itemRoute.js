module.exports = function(app){
    const item = require('../controllers/itemController');
    const jwtMiddleware = require('../../../config/jwtMiddleware');

    app.get('/items', jwtMiddleware, item.getMain);
    app.get('/users/:userIdx/items/all',jwtMiddleware,item.getAllItem);
    app.get('/users/:userIdx/items/on-sale', jwtMiddleware, item.getOnSale);
    app.get('/users/:userIdx/items/completion', jwtMiddleware, item.getCompletion);
    app.get('/users/:userIdx/items/hide', jwtMiddleware, item.getHide);
    app.patch('/items/:itemIdx/status',jwtMiddleware,item.changeStatus);
    app.patch('/items/:itemIdx/boost',jwtMiddleware,item.getBoost);
    
    app.get('/items/:itemIdx',jwtMiddleware,item.getItemDetail);
    app.post('/items',jwtMiddleware,item.postItem);
    app.delete('/items/:itemIdx',jwtMiddleware,item.deleteItem);
    app.patch('/items/:itemIdx',jwtMiddleware,item.setItem);

    app.get('/items/:itemIdx/another',jwtMiddleware,item.getOtherItem);
    app.get('/items/:itemIdx/recommendation',jwtMiddleware, item.getRecommendItem);
    app.get('/items/categories/list',jwtMiddleware,item.getCategoryList);

};
