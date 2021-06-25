const {pool} = require('../../../config/database');
const {logger} = require('../../../config/winston');
const chatDao = require('../dao/chatDao');


/** 채팅으로 거래하기 API
 * [POST] /chatrooms
 * body : itemId
 */
exports.postChatroom = async function (req, res) {
    const itemId = req.body.itemIdx;
    const userId = req.verifiedToken.id;

    if(typeof itemId === 'undefined' || itemId === null || itemId === ''){

        return res.json({
            isSuccess: false,
            code: 2810,
            message: "itemIdx 값을 제대로 입력해주세요",
        })
    }

    if(isNaN(itemId)){

        return res.json({
            isSuccess: false,
            code: 2811,
            message: "itemIdx 값은 숫자로 입력하세요",
         })
    }

    const getItemInfoRows = await chatDao.getItemInfo(itemId);

    if(getItemInfoRows < 1){

        return res.json({
            isSuccess: false,
            code: 2099,
            message: "없는 상품입니다.",
        })
    }

    try {
        const level = await getItemInfoRows[0].level;
        const latitude = await getItemInfoRows[0].latitude; //위도
        const logitude = await getItemInfoRows[0].logitude; //경도

        const locationInfoRows = await chatDao.checkLocationInfo(level,latitude,logitude,userId);

        if(locationInfoRows < 1){

            return res.json({
                isSuccess: false,
                code: 2222,
                message: "거래가 불가능한 지역입니다.",
            })
        }

        const postChatroomRows = await chatDao.makeChatroom(itemId,userId);

        return res.json({

            result: postChatroomRows,
            isSuccess: true,
            code: 1000,
            message: "채팅방 생성 성공",
        })

    } catch (err) {
        logger.error(`App - get near location info Query error\n: ${JSON.stringify(err)}`);

        return res.json({
            isSuccess: false,
            code: 2000,
            message: "채팅방 생성 실패",
        });
    }
};

/** 빈방 뒤로가기 하면 삭제 API
 * [DELETE] /chatrooms/:chatroomIdx/no-messages
 * params : chatroomId
 */
exports.deleteEmptyChatroom = async function (req, res) {
    const chatroomId = req.params.chatroomIdx;
    const userId = req.verifiedToken.id;

    if(typeof chatroomId == 'undefined' || chatroomId === null || chatroomId === ''){

        return res.json({
            isSuccess: false,
            code: 2812,
            message: "chatroomIdx 값을 제대로 입력해주세요",
        })
    }

        if(isNaN(chatroomId)){

            return res.json({
                isSuccess: false,
                code: 2813,
                message: "chatroomIdx 값은 숫자로 입력하세요",
            })
        }

    try {

        const emptyChatroomRows = await chatDao.emptyChatroom(chatroomId);

        return res.json({

            isSuccess: true,
            code: 1000,
            message: "빈 채팅방 삭제 성공",
        })

    } catch (err) {
        logger.error(`App - delete empty chatroom Query error\n: ${JSON.stringify(err)}`);

        return res.json({
            isSuccess: false,
            code: 2000,
            message: "빈 채팅방 삭제 실패",
        });
    }
};

/** 내 채팅방 목록 조회 API
 * [GET] /chatrooms
 * 
 */
exports.getAllChatroom = async function (req, res) {
    const userId = req.verifiedToken.id;

    try {

        const getAllChatroomRows = await chatDao.getChatroomAll(userId);

        return res.json({
            result : getAllChatroomRows,
            isSuccess: true,
            code: 1000,
            message: "전체 채팅방 조회 성공",
        })

    } catch (err) {
        logger.error(`App - get all chatroom Query error\n: ${JSON.stringify(err)}`);

        return res.json({
            isSuccess: false,
            code: 1000,
            message: "전체 채팅방 조회 실패",
        });
    }
};

/** 채팅방 상단 상품 정보 조회 API
 * [GET] /chatrooms/:chatroomIdx/top-item
 * params : catroomId
 */
exports.getChatroomItem = async function (req, res) {
    const userId = req.verifiedToken.id;
    const chatroomId = req.params.chatroomIdx;

    if(typeof chatroomId === 'undefined' || chatroomId === null || chatroomId === ''){

        return res.json({
            isSuccess: false,
            code: 2812,
            message: "chatroomIdx 값을 제대로 입력해주세요",
        })
    }
    if(isNaN(chatroomId)){

        return res.json({
            isSuccess: false,
            code: 2813,
            message: "chatroomIdx 값은 숫자로 입력하세요",
        })
    }

    const checkUserInfoRows = await chatDao.getCheckUserInfo(chatroomId);

    if(checkUserInfoRows < 1){

        return res.json({
            isSuccess:false,
            code: 2100,
            message:"권한 없음"
        })
    }

    if(!(checkUserInfoRows[0].userId === userId || checkUserInfoRows[0].buyerId === userId)){

        return res.json({
            isSuccess:false,
            code: 2100,
            message:"권한 없음"
         })
}


    try {

        const getTopChatroomRows = await chatDao.getTopChatroomInfo(chatroomId);

        return res.json({
            result : getTopChatroomRows,
            isSuccess: true,
            code: 1000,
            message: "채팅방 상단 상품 정보 조회 성공",
        })

    } catch (err) {
        logger.error(`App - get top chatroom item Info Query error\n: ${JSON.stringify(err)}`);

        return res.json({
            isSuccess: false,
            code: 2000,
            message: "채팅방 상단 상품 정보 조회 실패",
        });
    }
};

/** 채팅방 상세 조회 API
 * [GET] /chatrooms/:chatroomIdx/detail
 * params : catroomId
 */
exports.getChatroomDetail = async function (req, res) {
    const userId = req.verifiedToken.id;
    const chatroomId = req.params.chatroomIdx;

    if(typeof chatroomId === 'undefined' || chatroomId === null || chatroomId === ""){

        return res.json({
            isSuccess: false,
            code: 2812,
            message: "chatroomIdx 값을 제대로 입력해주세요",
        })
    }

    if(isNaN(chatroomId)){

        return res.json({
            isSuccess: false,
            code: 2813,
            message: "chatroomIdx 값은 숫자로 입력하세요",
        })
    }

    const checkUserInfoRows = await chatDao.getCheckUserInfo(chatroomId);

    if(checkUserInfoRows < 1){

        return res.json({
            isSuccess:false,
            code: 2100,
            message:"권한 없음"
        })
    }

    if(!(checkUserInfoRows[0].userId === userId || checkUserInfoRows[0].buyerId === userId)){

        return res.json({
            isSuccess:false,
            code: 2100,
            message:"권한 없음"
        })
    }


    try {

        const getChatroomDetailRows = await chatDao.getChatroomDetailInfo(chatroomId,userId);

        return res.json({
            result : getChatroomDetailRows,
            isSuccess: true,
            code: 1000,
            message: "채팅방 상세 정보 조회 성공",
        })

    } catch (err) {
        logger.error(`App - get chatroom detail Info Query error\n: ${JSON.stringify(err)}`);
        
        return res.json({
            isSuccess: false,
            code: 2000,
            message: "채팅방 상세 정보 조회 실패",
        });
    }
};

/** 메시지 전송 API
 * [POST] /chatrooms/messages
 * body : chatroomId, contents
 */
exports.postMessage = async function (req, res) {
    const userId = req.verifiedToken.id;
    const {chatroomId, contents} = req.body;

    if(typeof chatroomId === 'undefined' || chatroomId === null || chatroomId === ''){

        return res.json({
            isSuccess: false,
            code: 2812,
            message: "chatroomIdx 값을 제대로 입력해주세요",
        });
    }

    if(isNaN(chatroomId)){

        return res.json({
            isSuccess: false,
            code: 2813,
            message: "chatroomIdx 값은 숫자로 입력하세요",
        });
    }

    if(typeof contents === 'undefined' || contents === null || contents === ''){

        return res.json({
            isSuccess: false,
            code: 2814,
            message: "contents 값을 제대로 입력해주세요",
        });
    }

    const checkUserInfoRows = await chatDao.getCheckUserInfo(chatroomId);

    if(checkUserInfoRows < 1){

        return res.json({
            isSuccess:false,
            code: 2100,
            message:"권한 없음"
        });
    }

    if(!(checkUserInfoRows[0].userId === userId || checkUserInfoRows[0].buyerId === userId)){

        return res.json({
            isSuccess:false,
            code: 2100,
            message:"권한 없음"
        });
}

    try {

        const postMessageRows = await chatDao.postMessageInfo(userId,chatroomId,contents);

        return res.json({
            isSuccess: true,
            code: 1000,
            message: "메시지 전송 성공",
        });

    } catch (err) {
        logger.error(`App - post message Info Query error\n: ${JSON.stringify(err)}`);

        return res.json({
            isSuccess: false,
            code: 2000,
            message: "메시지 전송 실패",
        });
    }
};

/** 채팅방 나가기 API
 * [PATCH] /chatrooms
 * body : chatroomId
 */
exports.deleteChatroom = async function (req, res) {
    const userId = req.verifiedToken.id;
    const chatroomId = req.body.chatroomIdx;

    if(typeof chatroomId === 'undefined' || chatroomId === null || chatroomId === ''){

        return res.json({
            isSuccess: false,
            code: 2812,
            message: "chatroomIdx 값을 제대로 입력해주세요",
        });
    }

    if(isNaN(chatroomId)){

        return res.json({
            isSuccess: false,
            code: 2813,
            message: "chatroomIdx 값은 숫자로 입력하세요",
        });
    }

    const checkUserInfoRows = await chatDao.getCheckUserInfo(chatroomId);

    if(checkUserInfoRows < 1){

        return res.json({
            isSuccess:false,
            code: 2100,
            message:"권한 없음"
        });
    }

    if(!(checkUserInfoRows[0].userId === userId || checkUserInfoRows[0].buyerId === userId)){

        return res.json({
            isSuccess:false,
            code: 2100,
            message:"권한 없음"
        });
}


    try {

        const deleteChatroomRows = await chatDao.deleteChatroomInfo(chatroomId);

        return res.json({
            isSuccess: true,
            code: 1000,
            message: "채팅방 나가기 성공",
        });

    } catch (err) {
        logger.error(`App - delete chatroom Info Query error\n: ${JSON.stringify(err)}`);

        return res.json({
            isSuccess: false,
            code: 2000,
            message: "채팅방 나가기 실패",
        });
    }
};