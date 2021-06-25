const {pool} = require('../../../config/database');
const {logger} = require('../../../config/winston');

const jwt = require('jsonwebtoken');
const secret_config = require('../../../config/secret');
let request = require('request');

//create signature2
let CryptoJS = require('crypto-js');
const userDao = require('../dao/userDao');

/**
 01.login API = 회원가입/로그인
 */
exports.login = async function (req, res) {
    const {
        phoneNumber, authNumber
    } = req.body;

        try {
            // 인증번호 확인

            const authRows = await userDao.userSmsCheck(phoneNumber,authNumber);

            if(!(authRows.length > 0)){

                return res.json({
                    isSuccess: false,
                    code: 2200,
                    message: "번호 인증 실패!"
                });
            }
            else{
                const checkRows = await userDao.deleteSmsCheck(phoneNumber);
            }

            // 계정 확인
            const phoneRows = await userDao.userPhoneCheck(phoneNumber);

            if (!(phoneRows.length > 0)) {

                const nickName = await Math.floor(Math.random() * 1000);
                const insertUserInfoParams = [phoneNumber,nickName];
                const insertUserRows = await userDao.insertUserInfo(insertUserInfoParams);
                const [userInfoRows] = await userDao.selectUserInfo(phoneNumber);

                //토큰 생성
                let token = await jwt.sign({
                    id: userInfoRows[0].id,
                }, // 토큰의 내용(payload)
                secret_config.jwtsecret, // 비밀 키
                {
                    expiresIn: '365d',
                    subject: 'userInfo',
                } // 유효 시간은 365일
                );

            return res.json({
                    userInfo: userInfoRows[0],
                    jwt: token,
                    "newUser" : true,
                    isSuccess: true,
                    code: 1000,
                    message: "신규 회원 로그인 성공"
                });
            }

            else{
                const [userInfoRows] = await userDao.selectUserInfo(phoneNumber);

                if (userInfoRows[0].status === "DEACTIVE") {

                    return res.json({
                        isSuccess: false,
                        code: 3100,
                        message: "비활성화 된 계정입니다. 고객센터에 문의해주세요."
                    });
                } else if (userInfoRows[0].status === "DELETED") {

                    return res.json({
                        isSuccess: false,
                        code: 3101,
                        message: "탈퇴 된 계정입니다. 고객센터에 문의해주세요."
                    });
                }

                //토큰 생성
                let token = await jwt.sign({
                    id: userInfoRows[0].id,
                }, // 토큰의 내용(payload)
                secret_config.jwtsecret, // 비밀 키
                {
                    expiresIn: '365d',
                    subject: 'userInfo',
                } // 유효 시간은 365일
                );

                return  res.json({
                        userInfo: userInfoRows[0],
                        jwt: token,
                        "newUser" : false,
                        isSuccess: true,
                        code: 1000,
                        message: "기존 회원 로그인 성공"
                    });
            }
            
        } catch (err) {
            logger.error(`App - login Query error\n: ${err.message}`);

            return res.json({
                isSuccess: false,
                code: 2000,
                message: "로그인/회원가입 실패",
            });
        }
};

//SMS 인증
exports.send = async function (req, res) {
    let user_phone_number = req.body.phoneNumber;
	let user_auth_number = await Math.floor((Math.random() * (1000000-100000))+100000);
	let resultCode = 404;

    let requestIdx = "";
    let requestTimes = "";

	const date = Date.now().toString();
	const uri = 'ncp:sms:kr:263699328390:danguen_clone';
	const secretKey = 'DIk0TFc6NCuGUbfk6MHscFw9GrB58ru78iK50J9h';
	const accessKey = 'hJhVqZHwe4Pqws7a7rgL';
	const method = 'POST';
	const space = " ";
	const newLine = "\n";
	const url = `https://sens.apigw.ntruss.com/sms/v2/services/${uri}/messages`;
	const url2 = `/sms/v2/services/${uri}/messages`;

	const  hmac = CryptoJS.algo.HMAC.create(CryptoJS.algo.SHA256, secretKey);

	hmac.update(method);
	hmac.update(space);
	hmac.update(url2);
	hmac.update(newLine);
	hmac.update(date);
	hmac.update(newLine);
	hmac.update(accessKey);

	const hash = hmac.finalize();
	const signature = hash.toString(CryptoJS.enc.Base64);

    try{
    request({
		method : method,
		json : true,
		uri : url,
        
		headers : {
			'Contenc-type': 'application/json; charset=utf-8',
			'x-ncp-iam-access-key': accessKey,
			'x-ncp-apigw-timestamp': date,
			'x-ncp-apigw-signature-v2': signature
		},
		body : {
			'type' : 'SMS',
			'countryCode' : '82',
			'from' : '01091287714',
			'content' : `당근마켓 인증번호 ${user_auth_number} 입니다.`,
			'messages' : [
				{
					'to' : `${user_phone_number}`
				}
			]
		}
	}, async function(err, response, body) {
        requestIdx = response.body.requestId;
        requestTimes = response.body.requestTime;
		if(err) {
            console.log(err);
            return res.json({
                isSuccess: false,
                code : 3102,
                message: "문자 메세지 발송 실패"
            })
        }
		else {
			resultCode = 1000;
			console.log(body);
            const insertSmsRows = await userDao.insertAuthNum(user_phone_number,user_auth_number);
           return res.json({
                isSuccess: true,
                code : resultCode,
                message: "문자 메세지 발송 성공"
            })
		}
	});
    
}
catch(err){
	logger.error(`error\n: ${JSON.stringify(err)}`);
            return false;
}
};

/**
 update : 2019.09.23
 03.check API = token 검증
 **/
exports.check = async function (req, res) {
    res.json({
        isSuccess: true,
        code: 1000,
        message: "검증 성공",
        info: req.verifiedToken
    })
};

/**
 update : 2021.02.07
 05.get user info API = 프로필 정보 조회
 **/
exports.get = async function (req, res) {
    const userId = parseInt(req.params.userId);

    try {   
        const [getUserProfileInfoRows] = await userDao.getUserProfileInfo(userId);
        const [getUserReviewInfoRows] = await userDao.getUserReviewInfo(userId);
        const [getUserLocationInfoRows] = await userDao.getUserLocationInfo(userId);
        const [getUserFeedbackInfoRows] = await userDao.getUserFeedbackInfo(userId);

        return res.json({
            result: {
                profile: getUserProfileInfoRows,
                review: getUserReviewInfoRows,
                location: getUserLocationInfoRows,
                feedback: getUserFeedbackInfoRows
            },
            isSuccess: true,
            code: 1000,
            message: "프로필 정보 조회 성공",
        })

    } catch (err) {
        logger.error(`App - get user info Query error\n: ${JSON.stringify(err)}`);
        //connection.release();
        return res.json({
            isSuccess: false,
            code: 2000,
            message: "프로필 정보 조회 실패",
        });
    }
};

/**
 update : 2021.02.07
 06.edit user profile info API = 프로필 수정
 **/
exports.edit = async function (req, res) {
    const userId = parseInt(req.params.userId);

    const {
        profilePhotoUrl, nickname
    } = req.body;

    if (req.verifiedToken.id != userId) return res.status(403).json({
        isSuccess:false,
        code: 2100,
        message:"권한 없음"
    });

    try {   
        const editUserProfileInfoParams = [profilePhotoUrl, nickname, userId];
        const editUserProfileInfoRows = await userDao.editUserProfileInfo(editUserProfileInfoParams);

        return res.json({
            isSuccess: true,
            code: 1000,
            message: "프로필 수정 성공",
        })

    } catch (err) {
        logger.error(`App - edit user profile info Query error\n: ${JSON.stringify(err)}`);
        //connection.release();
        return res.json({
            isSuccess: false,
            code: 2000,
            message: "프로필 수정 실패",
        });
    }
};

/**
 update : 2021.02.07
 07.delete account API = 계정 탈퇴
 **/
exports.delete = async function (req, res) {
    
    const userId = parseInt(req.params.userId);

    if (req.verifiedToken.id != userId) return res.status(403).json({
        isSuccess:false,
        code: 2100,
        message:"권한 없음"
    });

    try {
        const deleteUserInfoRows = await userDao.deleteUserInfo(userId);

        return res.json({
            isSuccess: true,
            code: 1000,
            message: "계정 탈퇴 성공",
        })

    } catch (err) {
        logger.error(`App - delete account Query error\n: ${JSON.stringify(err)}`);

        return res.json({
            isSuccess: false,
            code: 2000,
            message: "계정 탈퇴 실패",
        });
    }
};



exports.getTest = async function (req, res) {

    try {   
        const [getUserProfileInfoRows] = await userDao.getTests();

        return res.json({
            result: getUserProfileInfoRows,
            isSuccess: true,
            code: 1000,
            message: "프로필 정보 조회 성공",
        })

    } catch (err) {
        logger.error(`App - get user info Query error\n: ${JSON.stringify(err)}`);
        
        return res.json({
            isSuccess: false,
            code: 2000,
            message: "프로필 정보 조회 실패",
        });
    }
};