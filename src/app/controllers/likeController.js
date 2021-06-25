const {pool} = require('../../../config/database');
const {logger} = require('../../../config/winston');
const likeDao = require('../dao/likeDao');



/** 상품 찜하기 API
 * [PATCH] /items/likes
 * body : itemIdx
 */
exports.setLikeItem = async function (req, res) {
    const userIdx = req.verifiedToken.id;
    const itemIdx = req.body.itemIdx;

    if(typeof itemIdx === 'undefined' || itemIdx === null || itemIdx === ''){

        return res.json({
            isSuccess: false,
            code: 2610,
            message: "itemIdx 값을 제대로 입력해주세요",
        })
    }

    if(isNaN(itemIdx)){

        return res.json({
            isSuccess: false,
            code: 2611,
            message: "itemIdx 값은 숫자로 입력해주세요",
        })
    }


    try {
        const getLikeInfoRows = await likeDao.getLikeInfo(userIdx, itemIdx);

        if(!(getLikeInfoRows.length > 0)){

            const insertLikeInfoRows = await likeDao.insertLikeInfo(userIdx, itemIdx);

            return res.json({
                isSuccess:true,
                code: 1000,
                message:"상품 찜 성공"
            });
        }
    else{
        if(getLikeInfoRows[0].isLike == 'Y'){
            const setLikeInfoRows = await likeDao.setLikeInfo(userIdx, itemIdx, 'N');

            return res.json({
                isSuccess: true,
                code: 1000,
                message: "상품 찜 해제 성공",
            })
        }
        else{
            const setLikeInfoRows = await likeDao.setLikeInfo(userIdx, itemIdx, 'Y');

            return res.json({
                isSuccess: true,
                code: 1000,
                message: "상품 찜 성공",
            })
        }
    }
    } catch (err) {
        logger.error(`App - set like item info Query error\n: ${JSON.stringify(err)}`);

        return res.json({
            isSuccess: false,
            code: 2000,
            message: "상품 찜 실패",
        });
    }
};


/** 찜한 상품 조회 API
 * [GET] /items/likes
 * 
 */
exports.getLikeItem = async function (req, res) {
    const userIdx = req.verifiedToken.id;
    
    try {
        const getLikeInfoRows = await likeDao.getLikeItemInfo(userIdx);

        return res.json({
            result: getLikeInfoRows,
            isSuccess: true,
            code: 1000,
            message: "찜한 상품 조회 성공",
        })
        
    }
     catch (err) {
        logger.error(`App - get like item info Query error\n: ${JSON.stringify(err)}`);

        return res.json({
            isSuccess: false,
            code: 2000,
            message: "찜한 상품 조회 실패",
        });
    }
};


/** 유저 팔로우 API
 * [PATCH] /users/likes
 * body : userIdx
 */
exports.setLikeUser = async function (req, res) {
    const userIdx = req.verifiedToken.id;
    const choiceUserIdx = req.body.userIdx;
    
    if(typeof choiceUserIdx === 'undefined' || choiceUserIdx === null || choiceUserIdx === ''){

        return res.json({
            isSuccess: false,
            code: 2620,
            message: "userIdx 값을 제대로 입력해주세요",
        })
    }

    if(isNaN(choiceUserIdx)){

        return res.json({
            isSuccess: false,
            code: 2621,
            message: "userIdx 값은 숫자로 입력해주세요",
        })
    }

    try {

        const getLikeUserInfoRows = await likeDao.getUserLikeInfo(userIdx, choiceUserIdx);

        if(!(getLikeUserInfoRows.length > 0)){

            const insertUserLikeInfoRows = await likeDao.insertUserLikeInfo(userIdx, choiceUserIdx);

            return res.status(403).json({
                isSuccess:true,
                code: 1000,
                message:"유저 팔로우 성공"
            });
        }
        else{

            if(getLikeUserInfoRows[0].isFollow === 'Y'){

                const setUserLikeInfoRows = await likeDao.setUserLikeInfo(userIdx, choiceUserIdx, 'N');

                return res.json({
                    isSuccess: true,
                    code: 1000,
                    message: "유저 팔로우 해제 성공",
                })
            }
            else{

                const setUserLikeInfoRows = await likeDao.setUserLikeInfo(userIdx,choiceUserIdx,'Y');

                return res.json({
                    isSuccess: true,
                    code: 1000,
                    message: "유저 팔로우 성공",
                })
            }
    }

    } catch (err) {
        logger.error(`App - set like user info Query error\n: ${JSON.stringify(err)}`);

        return res.json({
            isSuccess: false,
            code: 2000,
            message: "유저 팔로우 실패",
        });
    }
};


/** 팔로우한 유저 모아보기 API
 * [GET] /users/likes
 * 
 */
exports.getLikeUser = async function (req, res) {
    const userIdx = req.verifiedToken.id;
    
    try {
            const getUserLikeInfoRows = await likeDao.getLikeUserInfo(userIdx);

            return res.json({
                result: getUserLikeInfoRows,
                isSuccess: true,
                code: 1000,
                message: "팔로우한 유저 상품 조회 성공",
            })
    }
     catch (err) {
        logger.error(`App - get like user info Query error\n: ${JSON.stringify(err)}`);

        return res.json({
            isSuccess: false,
            code: 2000,
            message: "팔로우한 유저 상품 조회 실패",
        });
    }
};