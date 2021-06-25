const {pool} = require('../../../config/database');
const {logger} = require('../../../config/winston');
const scheduleDao = require('../dao/scheduleDao');



/**
 update : 2021.02.19
 스케줄러 1시간마다 인기검색어 갱신
 **/
exports.updateKeyword = async function (req, res) {

    try {   
        const updateKeywordRows = scheduleDao.updateKeyword();

        console.log("갱신성공!");
        return true;

    } catch (err) {
        console.log("갱신실패!");
        return false;
    }
};
