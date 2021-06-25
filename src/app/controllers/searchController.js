const {pool} = require('../../../config/database');
const {logger} = require('../../../config/winston');
const searchDao = require('../dao/searchDao');
/*

1. 안쓰는 모듈 정리
2. 주석 인풋 아웃풋
3. 띄어쓰기, 엔터 정리
4. 로직 가독성(if ! 등등 수정)
5. 연산자 비교 typeof ===
6. 문자열 '' 로 통일
7. lati logi 등 구조 분해 할당 적용하기
8. 변수명 명확하게
9. 안쓰는 로직 삭제
10. 단순 상수들 의미있는 이름으로 상수화 or 변수화

*/

/** 상품 검색 조회 API
 * [GET]] /items/search/keywords
 * query : keyword
 */
exports.getItemSearch = async function (req, res) {
    const userIdx = req.verifiedToken.id;
    const keyword = req.query.keyword;
    let blank_pattern = /^\s+|\s+$/g;

    // 위도, 경도, 단계 호출
    const getLocationInfoRows = await searchDao.getLocation(userIdx);

    if(!(getLocationInfoRows.length > 0)){

        return res.status(403).json({
            isSuccess:false,
            code: 2350,
            message:"지역 설정을 해주세요"
        });
    }
    
    try {
        if(typeof keyword === 'undefined' || keyword === null || keyword === ''){

            return res.json({
                isSuccess: false,
                code: 2451,
                message: "검색어를 제대로 입력하세요",
            })
        }

        if( keyword.replace( blank_pattern, '' ) == '' ){

            return res.status(403).json({
                isSuccess:false,
                code: 2450,
                message:"공백만 입력됐습니다."
            });
        }

        const latitude = await getLocationInfoRows[0].latitude; //위도
        const logitude = await getLocationInfoRows[0].logitude; //경도   
        const searchInfoRows = await searchDao.getSearchItem(latitude, logitude, keyword, userIdx);

        return res.json({
            result: searchInfoRows,
            isSuccess: true,
            code: 1000,
            message: "상품 검색 성공",
        })
    } catch (err) {
        logger.error(`App - get search item info Query error\n: ${JSON.stringify(err)}`);

        return res.json({
            isSuccess: false,
            code: 2000,
            message: "상품 검색 실패",
        });
    }
};

/** 상품 검색 조회(필터링) API
 * [GET]] /items/search/filter
 * query : level, categoryId, minPrice, maxPrice, keyword
 */
exports.filterItemSearch = async function (req, res) {
    let {level, categoryId, minPrice, maxPrice, keyword} = req.query;
    const userIdx = req.verifiedToken.id;
    let blank_pattern = /^\s+|\s+$/g;

    if(typeof level === 'undefined' || level === null || level === ''){
        level = 10;
    }
    if(typeof categoryId === 'undefined' || categoryId === null || categoryId === ''){
        categoryId = [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15];
    }
    if(typeof minPrice === 'undefined' || minPrice === null || minPrice === ''){
        minPrice = 0;
    }
    if(typeof maxPrice === 'undefined' || maxPrice === null || maxPrice === ''){
        maxPrice = 100000000;
    }

    if(!(level === 1 || level === 3 || level === 5 || level === 10)){

        return res.status(403).json({
            isSuccess:false,
            code: 2461,
            message:"지역 범위는 1,3,5,10 넷중 한개로 입력하세요"
        });
    }

    const checkCategory = await searchDao.checkCategory(categoryId);

    if(!checkCategory){

        return res.json({
            isSuccess: false,
            code: 2362,
            message: "카테고리Idx값은 INT로 입력하세요",
        })
    }
    const checkMinPrice = await searchDao.checkCategory(minPrice);

    if(!checkMinPrice){

        return res.json({
            isSuccess: false,
            code: 2363,
            message: "최소 가격은 INT로 입력하세요",
        })
    }
    const checkMaxPrice = await searchDao.checkCategory(maxPrice);

    if(!checkMaxPrice){

        return res.json({
            isSuccess: false,
            code: 2364,
            message: "최대 가격은 INT로 입력하세요",
        })
    }

    // 위도, 경도, 단계 호출
    const getLocationInfoRows = await searchDao.getLocation(userIdx);

    if(!(getLocationInfoRows.length > 0)){

        return res.status(403).json({
            isSuccess:false,
            code: 2465,
            message:"지역 설정을 해주세요"
        });
    }
    
    try {
        if(typeof keyword === 'undefined' || keyword === null || keyword === ''){

            return res.json({
                isSuccess: false,
                code: 2466,
                message: "검색어를 제대로 입력하세요",
            })
        }

        if( req.query.keyword.replace( blank_pattern, '' ) == "" ){
            return res.status(403).json({
                isSuccess:false,
                code: 2467,
                message:"공백만 입력됐습니다."
            });
        }

        const latitude = await getLocationInfoRows[0].latitude; //위도
        const logitude = await getLocationInfoRows[0].logitude; //경도   
        const filterSearchInfoRows = await searchDao.filterSearchItem(latitude,logitude,keyword,level,categoryId,minPrice,maxPrice);

        return res.json({
            result: filterSearchInfoRows,
            isSuccess: true,
            code: 1000,
            message: "상품 필터링 검색 성공",
        })

    } catch (err) {
        logger.error(`App - filter search item info Query error\n: ${JSON.stringify(err)}`);

        return res.json({
            isSuccess: false,
            code: 2000,
            message: "상품 필터링 검색 실패",
        });
    }
};

/** 유저 검색 조회 API
 * [GET]] /users/search/keywords
 * query : keyword
 */
exports.getUserSearch = async function (req, res) {
    const keyword = req.query.keyword;
    const userIdx = req.verifiedToken.id;
    let blank_pattern = /^\s+|\s+$/g;

    // 위도, 경도, 단계 호출
    const getLocationInfoRows = await searchDao.getLocation(userIdx);

    if(!(getLocationInfoRows.length > 0)){

        return res.status(403).json({
            isSuccess:false,
            code: 2471,
            message:"지역 설정을 해주세요"
        });
    }
    
    try {
        if(keyword == "undefined" || keyword == null || keyword == ""){

            return res.json({
                isSuccess: false,
                code: 2472,
                message: "검색어를 제대로 입력하세요",
            })
        }

        if( keyword.replace( blank_pattern, '' ) == "" ){

            return res.status(403).json({
                isSuccess:false,
                code: 2473,
                message:"공백만 입력됐습니다."
            });
        }
        const latitude = await getLocationInfoRows[0].latitude; //위도
        const logitude = await getLocationInfoRows[0].logitude; //경도   

        if(keyword[0] ==='#'){
            const keywords = keyword.substring(1);
            const userSearchInfoRows = await searchDao.getSearchUserIndex(latitude,logitude,keywords);

            return res.json({
                result: userSearchInfoRows,
                isSuccess: true,
                code: 1000,
                message: "유저 검색 성공",
            })

        }
        else{
            const userSearchInfoRows = await searchDao.getSearchUser(latitude,logitude,keyword);

            return res.json({
                result: userSearchInfoRows,
                isSuccess: true,
                code: 1000,
                message: "유저 검색 성공",
            })
        }
    } catch (err) {
        logger.error(`App - search user info Query error\n: ${JSON.stringify(err)}`);

        return res.json({
            isSuccess: false,
            code: 2000,
            message: "유저 검색 실패",
        });
    }
};


/** 인기 검색어 조회 API
 * [GET]] /popularity/keywords
 * 
 */
exports.getKeyword = async function (req, res) {
    
    try {
        const popularKeywordRows = await searchDao.getPopularKeyword();

        if(popularKeywordRows.length<1){
            return res.json({
                isSuccess: false,
                code: 3650,
                message: "인기 검색어가 없습니다.",
            })
        }

        return res.json({
            result: popularKeywordRows,
            isSuccess: true,
            code: 1000,
            message: "인기 검색어 조회 성공",
        })
    } catch (err) {
        logger.error(`App - get popular keyword Query error\n: ${JSON.stringify(err)}`);

        return res.json({
            isSuccess: false,
            code: 2000,
            message: "인기 검색어 조회 실패",
        });
    }
};