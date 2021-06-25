module.exports = function(app){
    const location = require('../controllers/locationController');
    const jwtMiddleware = require('../../../config/jwtMiddleware');

    app.get('/locations/near', jwtMiddleware, location.getNearLocation);
    app.get('/locations/search', jwtMiddleware, location.getSearchLocation);
    app.post('/locations',jwtMiddleware,location.setLocation);
    app.get('/locations',jwtMiddleware,location.getMyLocation);

    app.patch('/locations',jwtMiddleware,location.setMyLocation);
    app.delete('/locations',jwtMiddleware,location.deleteMyLocation);

    app.get('/locations/neighborhood',jwtMiddleware,location.getNeighborhood);
    app.get('/locations/neighborhood/detail',jwtMiddleware,location.getNeighborhoodDetail);
    app.patch('/locations/neighborhood',jwtMiddleware,location.setNeighborhood);

    app.get('/locations/certification',jwtMiddleware,location.getLocationCert);
    app.patch('/locations/certification',jwtMiddleware,location.setLocationCert);
};
