const express = require('express');
const compression = require('compression');
const methodOverride = require('method-override');
var cors = require('cors');
module.exports = function () {
    const app = express();

    app.use(compression());

    app.use(express.json());

    app.use(express.urlencoded({extended: true}));

    app.use(methodOverride());

    app.use(cors());
    // app.use(express.static(process.cwd() + '/public'));

    /* App (Android, iOS) */
    require('../src/app/routes/indexRoute')(app);
    require('../src/app/routes/userRoute')(app);
    require('../src/app/routes/testRoute')(app);
    require('../src/app/routes/naverRoute')(app);
    require('../src/app/routes/itemRoute')(app);
    require('../src/app/routes/locationRoute')(app);
    require('../src/app/routes/searchRoute')(app);
    require('../src/app/routes/likeRoute')(app);
    require('../src/app/routes/chatRoute')(app);
    require('../src/app/routes/scheduleRoute')(app);

    /* Web */
    // require('../src/web/routes/indexRoute')(app);

    /* Web Admin*/
    // require('../src/web-admin/routes/indexRoute')(app);
    return app;
};