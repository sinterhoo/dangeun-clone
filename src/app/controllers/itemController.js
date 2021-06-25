const {pool} = require('../../../config/database');
const {logger} = require('../../../config/winston');
const itemDao = require('../dao/itemDao');



/** 상품 메인화면 조회 API
 * [GET] /items
 * query : categoryId, size, page
 */
exports.getMain = async function (req, res) {

    const {categoryId, size} = req.query;
    let page = (req.query.page-1)*10;

    if(page === 0){
        page = 1;
    }
    
    // 위도, 경도, 단계 호출
    const getLocationInfoRows = await itemDao.getLocation(req.verifiedToken.id);

    if(!(getLocationInfoRows.length>0)){
        return res.status(403).json({
            isSuccess:false,
            code: 2350,
            message:"지역 설정을 해주세요"
        });
    }

    try {

        if(typeof categoryId === 'undefined' || categoryId === null || categoryId === ''){
            return res.json({
                isSuccess: false,
                code: 2351,
                message: "카테고리Idx값을 제대로 입력하세요",
            })
        }
        const checking = await itemDao.checkCategory(categoryId);

        if(!checking){
            return res.json({
                isSuccess: false,
                code: 2352,
                message: "카테고리Idx값은 INT로 입력하세요",
            })
        }

        if(typeof size === 'undefined' || size === null || size === ''){
            return res.json({
                isSuccess: false,
                code: 2218,
                message: "size값을 제대로 입력하세요",
            })
        }

        if(typeof page === 'undefined' || page === null || page === ''){
            return res.json({
                isSuccess: false,
                code: 2219,
                message: "page값을 제대로 입력하세요",
            })
        }

        const level = await getLocationInfoRows[0].level;
        const latitude = await getLocationInfoRows[0].latitude; //위도
        const logitude = await getLocationInfoRows[0].logitude; //경도   
        const boardInfoRows = await itemDao.getBoardMain(level,latitude,logitude,categoryId,page,size);

        return res.json({
            result: boardInfoRows,
            isSuccess: true,
            code: 1000,
            message: "메인화면 조회 성공",
        })

    } catch (err) {
        logger.error(`App - get main board info Query error\n: ${JSON.stringify(err)}`);
        return res.json({
            isSuccess: false,
            code: 2000,
            message: "메인화면 조회 실패",
        });
    }
};

/** 전체 상품 조회 API
 * [GET] /users/:userIdx/items/all
 * params : userIdx
 */
exports.getAllItem = async function (req, res) {

    const userId = parseInt(req.params.userIdx);

    try {   
        const getUserAllInfoRows = await itemDao.getAllBoard(userId);

        return res.json({
            result: getUserAllInfoRows,
            isSuccess: true,
            code: 1000,
            message: "모든 상품 조회 성공",
        })

    } catch (err) {
        logger.error(`App - get all board info Query error\n: ${JSON.stringify(err)}`);
        return res.json({
            isSuccess: false,
            code: 2000,
            message: "모든 상품 조회 실패",
        });
    }
};


/** 판매중 상품 조회 API
 * [GET] /users/:userIdx/items/on-sale
 * params : userIdx
 */
exports.getOnSale = async function (req, res) {

    const userId = parseInt(req.params.userIdx);

    try {   
        const getUserOnSaleInfoRows = await itemDao.getOnSaleBoard(userId);

        return res.json({
            result: getUserOnSaleInfoRows,
            isSuccess: true,
            code: 1000,
            message: "판매중 상품 조회 성공",
        })

    } catch (err) {
        logger.error(`App - get onSale board info Query error\n: ${JSON.stringify(err)}`);
        return res.json({
            isSuccess: false,
            code: 2000,
            message: "판매중 상품 조회 실패",
        });
    }
};

/** 거래완료 상품 조회 API
 * [GET] /users/:userIdx/items/completion
 * params : userIdx
 */
exports.getCompletion = async function (req, res) {

    const userId = parseInt(req.params.userIdx);

    try {   
        const getUserCompletionInfoRows = await itemDao.getCompletionBoard(userId);

        return res.json({
            result: getUserCompletionInfoRows,
            isSuccess: true,
            code: 1000,
            message: "거래완료 상품 조회 성공",
        })

    } catch (err) {
        logger.error(`App - get completion board info Query error\n: ${JSON.stringify(err)}`);
        return res.json({
            isSuccess: false,
            code: 2000,
            message: "거래완료 상품 조회 실패",
        });
    }
};

/** 숨김 상품 조회 API
 * [GET] /users/:userIdx/items/hide
 * params : userIdx
 */
exports.getHide = async function (req, res) {

    const userId = parseInt(req.params.userIdx);
    const userIdx = req.verifiedToken.id;

    if (userIdx != userId) return res.status(403).json({
        isSuccess:false,
        code: 2100,
        message:"권한 없음"
    });

    try {   
        const getUserHideInfoRows = await itemDao.getHideBoard(userId);

        return res.json({
            result: getUserHideInfoRows,
            isSuccess: true,
            code: 1000,
            message: "숨김 상품 조회 성공",
        })

    } catch (err) {
        logger.error(`App - get hide board info Query error\n: ${JSON.stringify(err)}`);
        return res.json({
            isSuccess: false,
            code: 2000,
            message: "숨김 상품 조회 실패",
        });
    }
};

/** 판매중,예약중,거래완료,숨김 상태로 변경 API
 * [PATCH] /items/:itemIdx/status
 * body : status, itemId
 */
exports.changeStatus = async function (req, res) {

    const {status, itemId} = req.body;
    
    if(typeof itemId === 'undefined' || itemId === null || itemId === ''){
        return res.json({
            isSuccess: false,
            code: 2101,
            message: "itemIdx값을 제대로 주세요",
        })
    }

    const userId = await itemDao.checkItemUser(req.params.itemIdx);

    if (req.verifiedToken.id != userId[0].userId) return res.status(403).json({
        isSuccess:false,
        code: 2100,
        message:"권한 없음"
    });

    if (!(status === 'ONSALE' || status === 'RESERVATED' || status === 'COMPLETED' || status === 'HIDDEN')){
        return res.json({
            isSuccess: false,
            code: 2300,
            message: "상태값을 ONSALE, RESERVATED, COMPLETED, HIDDEN 4가지 중 한개로 주세요",
        })
    }

    try {   
        const changeItemInfoRows = await itemDao.changeItemInfo(status,itemId);

        return res.json({
            isSuccess: true,
            code: 1000,
            message: "상품 상태 "+req.body.status+"로 변경 성공",
        })

    } catch (err) {
        logger.error(`App - change item info Query error\n: ${JSON.stringify(err)}`);
        return res.json({
            isSuccess: false,
            code: 2000,
            message: "상품 상태변경 실패",
        });
    }
};


/** 상품 끌올 API
 * [PATCH] /items/:itemIdx/boost
 * params : itemId
 */
exports.getBoost = async function (req, res) {
    
    const userId = await itemDao.checkItemUser(req.params.itemIdx);
    const userIdx = req.verifiedToken.id;

    if (userIdx != userId[0].userId) return res.status(403).json({
        isSuccess:false,
        code: 2100,
        message:"권한 없음"
    });

    if(userId[0].times<36){
        return res.json({
            isSuccess: false,
            code: 2000,
            message: 36-userId[0].times+"시간 뒤에 끌어올릴 수 있어요",
        })
    }

    try {   
        const boostItemInfoRows = await itemDao.boostItemInfo(req.params.itemIdx);

        return res.json({
            isSuccess: true,
            code: 1000,
            message: "끌어올리기 성공",
        })

    } catch (err) {
        logger.error(`App - boost item info Query error\n: ${JSON.stringify(err)}`);
        //connection.release();
        return res.json({
            isSuccess: false,
            code: 2000,
            message: "끌어올리기 실패",
        });
    }
};


/** 상품 상세 화면 조회 API
 * [GET] /items/:itemIdx
 * params : itemIdx
 */
exports.getItemDetail = async function (req, res) {

    const {itemIdx} = req.params;
    const userIdx = req.verifiedToken.id;
    
    // 위도, 경도, 단계 호출
    const getLocationInfoRows = await itemDao.getLocation(req.verifiedToken.id);
    if(!(getLocationInfoRows.length>0)){
        return res.json({
            isSuccess:false,
            code: 2350,
            message:"지역 설정을 해주세요"
        });
    }
    if(getLocationInfoRows[0].isCertified == 'N'){
        return res.json({
            isSuccess:false,
            code: 2680,
            message:"지역 인증을 해주세요"
        });
    }

    try {
        if(typeof itemIdx === 'undefined' || itemIdx === null || itemIdx === ""){
            return res.json({
                isSuccess: false,
                code: 2681,
                message: "상품Idx값을 제대로 입력하세요",
            })
        }
        
        const checking = await itemDao.checkCategory(itemIdx);

        if(!checking){
            return res.json({
                isSuccess: false,
                code: 2682,
                message: "상품Idx값은 INT로 입력하세요",
            })
        }

        const itemDetailInfoRows = await itemDao.getItemDetailInfo(userIdx, itemIdx);
        const itemDetailImgRows = await itemDao.getItemImgInfo(itemIdx);
        if(itemDetailInfoRows.length<1){
            return res.json({
                isSuccess: false,
                code: 3320,
                message: "없는 상품입니다.",
            })
        }
        return res.json({
            result: { imgList : itemDetailImgRows,
            itemDetail : itemDetailInfoRows},
            isSuccess: true,
            code: 1000,
            message: "상품 상세 페이지 조회 성공",
        })

    } catch (err) {
        logger.error(`App - get item detail info Query error\n: ${JSON.stringify(err)}`);
        return res.json({
            isSuccess: false,
            code: 2000,
            message: "상품 상세 페이지 조회 실패",
        });
    }
};

/** 판매자가 파는 다른 상품 조회 API
 * [GET] /items/:itemIdx/another
 * params : itemIdx
 */
exports.getOtherItem = async function (req, res) {
    
    const {itemIdx} = req.params;
    const userIdx = req.verifiedToken.id;
    
    // 위도, 경도, 단계 호출
    const getLocationInfoRows = await itemDao.getLocation(userIdx);

    if(!(getLocationInfoRows.length>0)){
        return res.json({
            isSuccess:false,
            code: 2350,
            message:"지역 설정을 해주세요"
        });
    }

    if(getLocationInfoRows[0].isCertified == 'N'){
        return res.json({
            isSuccess:false,
            code: 2680,
            message:"지역 인증을 해주세요"
        });
    }

    try {

        if(typeof itemIdx === 'undefined' || itemIdx === null || itemIdx === ""){
            return res.json({
                isSuccess: false,
                code: 2681,
                message: "상품Idx값을 제대로 입력하세요",
            })
        }
        const checking = await itemDao.checkCategory(itemIdx);

        if(!checking){
            return res.json({
                isSuccess: false,
                code: 2682,
                message: "상품Idx값은 INT로 입력하세요",
            })
        }

        const sellerInfoRows = await itemDao.getItemDetailInfo(userIdx, itemIdx);
        const itemAnotherInfoRows = await itemDao.getItemAnotherInfo(sellerInfoRows[0].userId, itemIdx);

        return res.json({
            result: itemAnotherInfoRows,
            isSuccess: true,
            code: 1000,
            message: "판매자가 판매하는 다른 상품 조회 성공",
        })

    } catch (err) {
        logger.error(`App - get Another item info Query error\n: ${JSON.stringify(err)}`);
        return res.json({
            isSuccess: false,
            code: 2000,
            message: "판매자가 판매하는 다른 상품 조회 실패",
        });
    }
};

/** 추천 상품들 조회 API
 * [GET] /items/:itemIdx/recommendation
 * params : itemIdx
 */
exports.getRecommendItem = async function (req, res) {

    const {itemIdx} = req.params;
    const userIdx = req.verifiedToken.id;
    
    // 위도, 경도, 단계 호출
    const getLocationInfoRows = await itemDao.getLocation(userIdx);

    if(!(getLocationInfoRows.length>0)){
        return res.json({
            isSuccess:false,
            code: 2350,
            message:"지역 설정을 해주세요"
        });
    }

    if(getLocationInfoRows[0].isCertified == 'N'){
        return res.json({
            isSuccess:false,
            code: 2680,
            message:"지역 인증을 해주세요"
        });
    }

    try {

        if(typeof itemIdx === 'undefined' || itemIdx === null || itemIdx === ''){
            return res.json({
                isSuccess: false,
                code: 2681,
                message: "상품Idx값을 제대로 입력하세요",
            })
        }
        const checking = await itemDao.checkCategory(itemIdx);

        if(!checking){
            return res.json({
                isSuccess: false,
                code: 2682,
                message: "상품Idx값은 INT로 입력하세요",
            })
        }
        const level = await getLocationInfoRows[0].level;
        const latitude = await getLocationInfoRows[0].latitude; //위도
        const logitude = await getLocationInfoRows[0].logitude; //경도

        const sellerInfoRows = await itemDao.getItemDetailInfo(req.verifiedToken.id,req.params.itemIdx);
        const itemRecommendInfoRows = await itemDao.getItemRecommend(level, latitude, logitude, sellerInfoRows[0].categoryId, itemIdx);

        return res.json({
            result: itemRecommendInfoRows,
            isSuccess: true,
            code: 1000,
            message: "이건 어때요 추천 상품 조회 성공",
        })

    } catch (err) {
        logger.error(`App - get Recommend item info Query error\n: ${JSON.stringify(err)}`);
        return res.json({
            isSuccess: false,
            code: 2000,
            message: "이건 어때요 추천 상품 조회 실패",
        });
    }
};

/** 카테고리 선택화면 조회 API
 * [GET] /items/categories/list
 * 
 */
exports.getCategoryList = async function (req, res) {

    try {   
        const categoryInfoRows = await itemDao.getCategoryInfo();

        return res.json({
            result : categoryInfoRows,
            isSuccess: true,
            code: 1000,
            message: "카테고리 목록 조회 성공",
        })

    } catch (err) {
        logger.error(`App - get category info Query error\n: ${JSON.stringify(err)}`);
        return res.json({
            isSuccess: false,
            code: 2000,
            message: "카테고리 목록 조회 실패",
        });
    }
};


/** 상품 등록 API
 * [POST] /items
 * body : categoryId, contents, title, img, price, nego, distance
 */
exports.postItem = async function (req, res) {
   
    const {categoryId, contents, title} = req.body;
    let {img, price, nego, distance} = req.body;

    // 위도, 경도, 단계 호출
    const getLocationInfoRows = await itemDao.getLocation(req.verifiedToken.id);

    if(!(getLocationInfoRows.length>0)){

        return res.json({
            isSuccess:false,
            code: 2350,
            message:"지역 설정을 해주세요"
        });
    }

    if(getLocationInfoRows[0].isCertified == 'N'){

        return res.json({
            isSuccess:false,
            code: 2680,
            message:"지역 인증을 해주세요"
        });
    }

    try {

        if(typeof img == 'undefined' || img === null || img === ''){
            img = 0;
        }

        if(typeof price == 'undefined' || price === null || price === ''){
            price = 0;
        }

        if(typeof nego === 'undefined' || nego === null || nego === ''){
            nego = 'Y';
        }

        if(typeof distance === 'undefined' || distance === null || distance === ''){
            distance = 3;
        }

        if(!(nego === 'Y' || nego === 'N')){

            return res.json({
                isSuccess: false,
                code: 2683,
                message: "negotiation 값에는 Y 또는 N만 올 수 있습니다.",
            })
        }

        if(!(distance === 1 || distance === 3 || distance === 5 || distance === 10)){

            return res.json({
                isSuccess: false,
                code: 2684,
                message: "distance는 1,3,5,10 값만 올 수 있습니다.",
            })
        }

        if(typeof categoryId === 'undefined' || categoryId === null || categoryId === ''){

            return res.json({
                isSuccess: false,
                code: 2685,
                message: "카테고리Idx값을 제대로 입력하세요",
            })
        }

        if(typeof contents === 'undefined' || contents === null || contents === ''){

            return res.json({
                isSuccess: false,
                code: 2686,
                message: "내용을 제대로 입력하세요",
            })
        }

        if(typeof title === 'undefined' || title === null || title === ''){

            return res.json({
                isSuccess: false,
                code: 2687,
                message: "제목을 제대로 입력하세요",
            })
        }

        const checking = await itemDao.checkCategory(categoryId);
        
        if(!checking){

            return res.json({
                isSuccess: false,
                code: 2688,
                message: "카테고리Idx값은 INT로 입력하세요",
            })
        }
        
        if(categoryId > 15){

            return res.json({
                isSuccess: false,
                code: 2689,
                message: "카테고리Idx값은 15이하로 주세요",
            })
        }
        
        await itemDao.insertItemInfo(req.verifiedToken.id,title,categoryId,getLocationInfoRows[0].locationId,price,nego,contents,distance,img);

        return res.json({
            isSuccess: true,
            code: 1000,
            message: "상품 등록 성공",
        })

    } catch (err) {
        logger.error(`App - insert item info Query error\n: ${JSON.stringify(err)}`);

        return res.json({
            isSuccess: false,
            code: 2000,
            message: "상품 등록 실패",
        });
    }
};


/** 상품 삭제 API
 * [DELETE] /items/:itemIdx
 * params : itemIdx
 */
exports.deleteItem = async function (req, res) {
    
    const {itemIdx} = req.params;
    const userIdx = req.verifiedToken.id;
    const userId = await itemDao.checkItemUser(req.params.itemIdx);

    if (userIdx != userId[0].userId){

        return res.status(403).json({
            isSuccess:false,
            code: 2100,
            message:"권한 없음"
        });
}

    try {   
        const deleteItemInfoRows = await itemDao.deleteItemInfo(itemIdx);

        return res.json({
            isSuccess: true,
            code: 1000,
            message: "상품 삭제 성공",
        })

    } catch (err) {
        logger.error(`App - delete Item info Query error\n: ${JSON.stringify(err)}`);

        return res.json({
            isSuccess: false,
            code: 2000,
            message: "상품 삭제 실패",
        });
    }
};

/** 상품 수정 API
 * [PATCH] /items/:itemIdx
 * body : categoryId, contents, title, img, price, nego, distance
 * params : itemIdx
 */
exports.setItem = async function (req, res) {

    const {categoryId, contents, title} = req.body;
    const {itemIdx} = req.params;
    const userIdx = req.verifiedToken.id;
    let {img, price, nego, distance} = req.body;

    const userId = await itemDao.checkItemUser(req.params.itemIdx);

    if (userIdx != userId[0].userId){

        return res.status(403).json({
            isSuccess:false,
            code: 2100,
            message:"권한 없음"
        });
}

    const getLocationInfoRows = await itemDao.getLocation(userIdx);

    if(!(getLocationInfoRows.length>0)){

        return res.json({
            isSuccess:false,
            code: 2350,
            message:"지역 설정을 해주세요"
        });
    }

    if(getLocationInfoRows[0].isCertified == 'N'){

        return res.json({
            isSuccess:false,
            code: 2680,
            message:"지역 인증을 해주세요"
        });
    }

    try {

        if(typeof img === 'undefined' || img == null || img === ''){
            img = 0;
        }

        if(typeof price == 'undefined' || price === null || price === ''){
            price = 0;
        }

        if(typeof nego === 'undefined' || nego === null || nego === ''){
            nego = 'Y';
        }

        if(typeof distance === 'undefined' || distance === null || distance === ''){
            distance = 3;
        }

        if(!(nego === 'Y' || nego === 'N')){

            return res.json({
                isSuccess: false,
                code: 2683,
                message: "negotiation 값에는 Y 또는 N만 올 수 있습니다.",
            })
        }

        if(!(distance === 1 || distance === 3 || distance === 5 || distance === 10)){

            return res.json({
                isSuccess: false,
                code: 2684,
                message: "distance는 1,3,5,10 값만 올 수 있습니다.",
            })
        }

        if(typeof categoryId === 'undefined' || categoryId === null || categoryId === ''){

            return res.json({
                isSuccess: false,
                code: 2685,
                message: "카테고리Idx값을 제대로 입력하세요",
            })
        }

        if(typeof contents === 'undefined' || contents === null || contents === ''){

            return res.json({
                isSuccess: false,
                code: 2686,
                message: "내용을 제대로 입력하세요",
            })
        }

        if(typeof title === 'undefined' || title === null || title === ''){

            return res.json({
                isSuccess: false,
                code: 2687,
                message: "제목을 제대로 입력하세요",
            })
        }

        const checking = await itemDao.checkCategory(categoryId);
        
        if(!checking){

            return res.json({
                isSuccess: false,
                code: 2688,
                message: "카테고리Idx값은 INT로 입력하세요",
            })
        }
        
        if(categoryId > 15){

            return res.json({
                isSuccess: false,
                code: 2689,
                message: "카테고리Idx값은 15이하로 주세요",
            })
        }
        
        const itemModifyInfoRows = await itemDao.modifyItemInfo(userIdx,title,categoryId,getLocationInfoRows[0].locationId,
            price,nego,contents,distance,img,req.params.itemIdx);
        
        return res.json({
            isSuccess: true,
            code: 1000,
            message: "상품 수정 성공",
        })

    } catch (err) {
        logger.error(`App - modify Item info Query error\n: ${JSON.stringify(err)}`);

        return res.json({
            isSuccess: false,
            code: 2000,
            message: "상품 수정 실패",
        });
    }
};