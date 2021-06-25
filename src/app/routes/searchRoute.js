module.exports = function(app){
    const search = require('../controllers/searchController');
    const jwtMiddleware = require('../../../config/jwtMiddleware');

    app.get('/items/search/keywords', jwtMiddleware, search.getItemSearch);
    app.get('/items/search/filter',jwtMiddleware,search.filterItemSearch);
    app.get('/users/search/keywords',jwtMiddleware,search.getUserSearch);

    app.get('/popularity/keywords',jwtMiddleware,search.getKeyword);
};
