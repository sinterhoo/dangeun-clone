const {pool} = require('../../../config/database');
const {logger} = require('../../../config/winston');
const locationDao = require('../dao/locationDao');



/** 내 위치로 동네검색 API
 * [GET] /locations/near
 * query : latitude, logitude
 */
exports.getNearLocation = async function (req, res) {
    const {latitude, logitude} = req.query;

    // 위도 경도 체크
    if(typeof latitude === 'undefined' || latitude === null || latitude === '' || typeof logitude === 'undefined' || logitude === null || logitude === ''){

        return res.json({
            isSuccess: false,
            code: 2505,
            message: "위도 경도 값을 제대로 입력하세요",
        })
    }

    try {
        const checking = await locationDao.checkQuery(latitude,logitude);

        if(!checking){

            return res.json({
                isSuccess: false,
                code: 2506,
                message: "위도 경도 값은 숫자로 입력하세요",
            })
        }
        const locationInfoRows = await locationDao.getLocationNear(latitude,logitude);

        return res.json({
            result: locationInfoRows,
            isSuccess: true,
            code: 1000,
            message: "동네 조회 성공",
        })
    } catch (err) {
        logger.error(`App - get near location info Query error\n: ${JSON.stringify(err)}`);

        return res.json({
            isSuccess: false,
            code: 2000,
            message: "동네 조회 실패",
        });
    }
};


/** 검색어로 동네 검색 API
 * [GET] /locations/search
 * query : keyword
 */
exports.getSearchLocation = async function (req, res) {
    const keyword = req.query.keyword;

    // 위도 경도 체크
    if(typeof keyword === 'undefined' || keyword === null || keyword === ''){

        return res.json({
            isSuccess: false,
            code: 2508,
            message: "검색어를 제대로 입력하세요",
        })
    }

    try {
        
        const locationSearchInfoRows = await locationDao.getLocationSearch(keyword);

        return res.json({
            result: locationSearchInfoRows,
            isSuccess: true,
            code: 1000,
            message: "동네 검색 성공",
        })

    } catch (err) {
        logger.error(`App - get search location info Query error\n: ${JSON.stringify(err)}`);

        return res.json({
            isSuccess: false,
            code: 2000,
            message: "동네 검색 실패",
        });
    }
};

/** 선택한 동네로 설정 API
 * [POST] /locations
 * body : locationIdx
 */
exports.setLocation = async function (req, res) {
    const locationId = req.body.locationIdx;
    const userIdx = req.verifiedToken.id;
        
    // body 값 체크
    if(typeof locationId === 'undefined' || locationId === null || locationId === ''){

        return res.json({
            isSuccess: false,
            code: 2515,
            message: "동네id를 제대로 입력해주세요",
        })
    }

    if(isNaN(locationId)){

        return res.json({
            isSuccess: false,
            code: 2516,
            message: "동네id는 숫자로 입력해주세요",
        })
    }

    const checkLo = await locationDao.checkLocation(userIdx, locationId);
    
    if(checkLo.length === 1){

        return res.json({
            isSuccess: false,
            code: 3510,
            message: "이미 설정한 동네입니다.",
        })
    }

    const locationCheck = await locationDao.checkCount(userIdx);

    if(locationCheck[0].counts >= 2){

        return res.json({
            isSuccess: false,
            code: 3518,
            message: "내 동네는 2개 이상 선택할 수 없습니다.",
        })
    }

    try {
        
        const locationSetInfoRows = await locationDao.setLocationInfo(userIdx, locationId);

        return res.json({
            isSuccess: true,
            code: 1000,
            message: "동네 등록 성공",
        })
    } catch (err) {
        logger.error(`App - set location info Query error\n: ${JSON.stringify(err)}`);

        return res.json({
            isSuccess: false,
            code: 2000,
            message: "동네 등록 실패",
        });
    }
};

/** 내 동네 설정화면 조회 API
 * [GET] /locations
 * 
 */
exports.getMyLocation = async function (req, res) {
    const userIdx = req.verifiedToken.id;

    try {
        const locationMyInfoRows = await locationDao.getLocationMy(userIdx);

        return res.json({
            result: locationMyInfoRows,
            isSuccess: true,
            code: 1000,
            message: "동네 조회 성공",
        })

    } catch (err) {
        logger.error(`App - get near location info Query error\n: ${JSON.stringify(err)}`);

        return false;
    }
};

/** 내 동네 설정 변경 API
 * [PATCH] /locations
 * body : locationIdx
 */
exports.setMyLocation = async function (req, res) {
    const locationId = req.body.locationIdx;
    const userIdx = req.verifiedToken.id;

    // body 값 체크
    if(typeof locationId === 'undefined' || locationId === null || locationId === ''){

        return res.json({
            isSuccess: false,
            code: 2519,
            message: "동네id를 제대로 입력해주세요",
        })
    }

    if(isNaN(locationId)){

        return res.json({
            isSuccess: false,
            code: 2520,
            message: "동네id는 숫자로 입력해주세요",
        })
    }

    const checkLo = await locationDao.checkLocation(userIdx, locationId);
    
    if(checkLo.length < 1){

        return res.json({
            isSuccess: false,
            code: 2521,
            message: "설정된 동네id를 입력해주세요",
        })
    }

    try {
        const locationMySetRows = await locationDao.setLocationMy(userIdx, locationId);

        return res.json({
            isSuccess: true,
            code: 1000,
            message: "동네 변경 성공",
        })
    } catch (err) {
        logger.error(`App - set My location info Query error\n: ${JSON.stringify(err)}`);

        return res.json({
            isSuccess: false,
            code: 2000,
            message: "동네 변경 실패",
        });
    }
};

/** 내 동네 설정 삭제 API
 * [DELETE] /locations
 * body : locationIdx
 */
exports.deleteMyLocation = async function (req, res) {
    const locationId = req.body.locationIdx;
    const userIdx = req.verifiedToken.id;
    
    // body 값 체크
    if(typeof locationId === 'undefined' || locationId === null || locationId === ''){

        return res.json({
            isSuccess: false,
            code: 2522,
            message: "동네id를 제대로 입력해주세요",
        })
    }

    if(isNaN(locationId)){

        return res.json({
            isSuccess: false,
            code: 2523,
            message: "동네id는 숫자로 입력해주세요",
        })
    }

    const checkLo = await locationDao.checkLocation(userIdx, locationId);
    
    if(checkLo.length < 1){

        return res.json({
            isSuccess: false,
            code: 2524,
            message: "설정된 동네id를 입력해주세요",
        })
    }

    const checkCo = await locationDao.checkLocationCount(userIdx);

    if(checkCo.length == 1){

        return res.json({
            isSuccess: false,
            code: 2525,
            message: "동네는 최소한 한개 이상 설정되어야 합니다.",
        })
    }

    try {
        const locationMyDeleteRows = await locationDao.deleteLocationMy(userIdx, locationId);

        return res.json({
            isSuccess: true,
            code: 1000,
            message: "동네 삭제 성공",
        })
    } catch (err) {
        logger.error(`App - delete My location info Query error\n: ${JSON.stringify(err)}`);

        return res.json({
            isSuccess: false,
            code: 2000,
            message: "동네 삭제 실패",
        });
    }
};


/** 내 동네 범위 조회 API
 * [GET] /locations/neighborhood
 * 
 */
exports.getNeighborhood = async function (req, res) {
    const userIdx = req.verifiedToken.id;
    const getLocationInfoRows = await locationDao.getLocation(userIdx);
    
    if(getLocationInfoRows < 1){
        return res.json({
            isSuccess: false,
            code: 2550,
            message: "동네 설정을 해주세요",
        })
    }

    try {
        const level = await getLocationInfoRows[0].level;
        const latitude = await getLocationInfoRows[0].latitude; //위도
        const logitude = await getLocationInfoRows[0].logitude; //경도 

        const locationMyRows = await locationDao.getNeighborhoodInfo(level,latitude,logitude,userIdx);

        return res.json({
            result: locationMyRows,
            isSuccess: true,
            code: 1000,
            message: "내 주변 동네 조회 성공",
        })
    } catch (err) {
        logger.error(`App - get neighborhood location info Query error\n: ${JSON.stringify(err)}`);

        return res.json({
            isSuccess: false,
            code: 2000,
            message: "내 주변 동네 조회 실패",
        });
    }
};

/** 내 동네 상세 리스트 조회 API
 * [GET] /locations/neighborhood/detail
 * 
 */
exports.getNeighborhoodDetail = async function (req, res) {
    const userIdx = req.verifiedToken.id;
    const getLocationInfoRows = await locationDao.getLocation(userIdx);
    
    if(getLocationInfoRows < 1){

        return res.json({
            isSuccess: false,
            code: 2550,
            message: "동네 설정을 해주세요",
        })
    }

    try {
        const level = await getLocationInfoRows[0].level;
        const latitude = await getLocationInfoRows[0].latitude; //위도
        const logitude = await getLocationInfoRows[0].logitude; //경도 

        const locationDetailRows = await locationDao.getNeighborhoodDetailInfo(level,latitude,logitude,userIdx);

        return res.json({
            result: locationDetailRows,
            isSuccess: true,
            code: 1000,
            message: "내 주변 동네 상세 조회 성공",
        })

    } catch (err) {
        logger.error(`App - get neighborhood location info Query error\n: ${JSON.stringify(err)}`);

        return res.json({
            isSuccess: false,
            code: 2000,
            message: "내 주변 동네 상세 조회 실패",
        });
    }
};

/** 내 동네 범위 변경 조회 API
 * [GET] /locations/neighborhood
 * body : level
 */
exports.setNeighborhood = async function (req, res) {
    const userIdx = req.verifiedToken.id;
    const level = req.body.level;
    const getLocationInfoRows = await locationDao.getLocation(userIdx);
    
    if(getLocationInfoRows < 1){

        return res.json({
            isSuccess: false,
            code: 2550,
            message: "동네 설정을 해주세요",
        })
    }

    if(typeof level === 'undefined' || level === null || level === ''){
        return res.json({
            isSuccess: false,
            code: 2530,
            message: "level 값을 제대로 입력해주세요",
        })
    }

    if(isNaN(level)){

        return res.json({
            isSuccess: false,
            code: 2531,
            message: "level 값은 숫자로 입력해주세요",
        })
    }

    if(!(level === 1 || level === 3 || level === 5 || level === 10)){

        return res.json({
            isSuccess: false,
            code: 2532,
            message: "level 값은 1,3,5,10 넷중 하나로 입력해주세요",
        })
    }

    try {
        const locationMyRows = await locationDao.setNeighborhoodInfo(level, userIdx);

        return res.json({
            isSuccess: true,
            code: 1000,
            message: "범위 변경 성공",
        })
    } catch (err) {
        logger.error(`App - set neighborhood location info Query error\n: ${JSON.stringify(err)}`);

        return res.json({
            isSuccess: false,
            code: 2000,
            message: "범위 변경 실패",
        });
    }
};


/** 현재 위치로 동네 인증 가능 여부 조회 API
 * [GET] /locations/certification
 * query : latitude, logitude
 */
exports.getLocationCert = async function (req, res) {
    const {latitude, logitude} = req.query;
    const userIdx = req.verifiedToken.id;

    // 위도 경도 체크
    if(typeof latitude === 'undefined' || latitude === null || latitude === '' || typeof logitude === 'undefined' || logitude === null || logitude === ''){

        return res.json({
            isSuccess: false,
            code: 2506,
            message: "위도 경도 값을 제대로 입력하세요",
        })
    }

    try {
        const checking = await locationDao.checkQuery(latitude,logitude);

        if(!checking){

            return res.json({
                isSuccess: false,
                code: 2507,
                message: "위도 경도 값은 숫자로 입력하세요",
            })
        }
        const locationInfo = await locationDao.getLocation(userIdx);

        if(locationInfo < 1){

            return res.json({
                isSuccess: false,
                code: 2508,
                message: "동네 설정을 해주세요",
            })
        }

        const locationInfoRows = await locationDao.getCertLocation(latitude,logitude,locationInfo[0].locationId);

        if(locationInfoRows.length > 0){

            return res.json({
                result: locationInfoRows,
                isSuccess: true,
                code: 1000,
                message: "동네 인증 가능",
            })

        }
        else{

            return res.json({
                isSuccess: false,
                code: 2000,
                message: "동네 인증 불가능",
            })
        }


    } catch (err) {
        logger.error(`App - get cert location info Query error\n: ${JSON.stringify(err)}`);

        return res.json({
            isSuccess: false,
            code: 2000,
            message: "동네 인증 가능 여부 조회 실패",
        });
    }
};

/** 동네 인증 완료 API
 * [PATCH] /locations/certification
 * body : locationIdx
 */
exports.setLocationCert = async function (req, res) {
    const locationIdx = req.body.locationIdx;
    const userIdx = req.verifiedToken.id;

    if(typeof locationIdx === 'undefined' || locationIdx === null || locationIdx === ''){

        return res.json({
            isSuccess: false,
            code: 2581,
            message: "locationIdx 값을 제대로 입력해주세요",
        })
    }

    if(isNaN(locationIdx)){

        return res.json({
            isSuccess: false,
            code: 2582,
            message: "locationIdx 값은 숫자로 입력해주세요",
        })
    }

    const checkLocation = await locationDao.getLocation(userIdx);

    if(!(checkLocation[0].locationId == locationIdx)){

        return res.json({
            isSuccess: false,
            code: 2583,
            message: "현재 선택된 지역의 locationIdx를 입력하세요",
        })
    }

    try {

        const locationInfoRows = await locationDao.setCertLocation(userIdx,locationIdx);

        if(locationInfoRows.length > 0){

            return res.json({
                result: locationInfoRows,
                isSuccess: true,
                code: 1000,
                message: "동네 인증 완료",
            })

        }
        else{

            return res.json({
                isSuccess: false,
                code: 2000,
                message: "동네 인증 실패",
            })
        }
    } catch (err) {
        logger.error(`App - get cert location info Query error\n: ${JSON.stringify(err)}`);

        return res.json({
            isSuccess: false,
            code: 2000,
            message: "동네 인증 실패",
        });
    }
};