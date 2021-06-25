module.exports = function(app){
    const schedule = require('../controllers/scheduleController');
    const jwtMiddleware = require('../../../config/jwtMiddleware');

    const cron = require('node-cron');

    cron.schedule('1 23 * * *',schedule.updateKeyword);

    
};
