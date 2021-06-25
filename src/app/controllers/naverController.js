const {pool} = require('../../../config/database');
const {logger} = require('../../../config/winston');


let client_id = 'DXk7R8MtLHVBDSEOboye';
let client_secret = 'zN8qq5QQIy';
let state = "RAMDOM_STATE";
let redirectURI = encodeURI("http://localhost:3000/call-back");
let api_url = "";

const naverDao = require('../dao/naverDao');
const jwt = require('jsonwebtoken');
const secret_config = require('../../../config/secret');



//네이버 로그인 웹 버전(임시 테스트용)
exports.login = async function (req, res) {
    api_url = 'https://nid.naver.com/oauth2.0/authorize?response_type=code&client_id=' + client_id + '&redirect_uri=' + redirectURI + '&state=' + state;
    res.writeHead(200, {'Content-Type': 'text/html;charset=utf-8'});
    res.end("<a href='"+ api_url + "'><img height='50' src='http://static.nid.naver.com/oauth/small_g_in.PNG'/></a>");
};



exports.callback = async function (req, res) {
    code = req.query.code;
    state = req.query.state;
    api_url = 'https://nid.naver.com/oauth2.0/token?grant_type=authorization_code&client_id='
     + client_id + '&client_secret=' + client_secret + '&redirect_uri=' + redirectURI + '&code=' + code + '&state=' + state;
    let request = require('request');
    let options = {
        url: api_url,
        headers: {'X-Naver-Client-Id':client_id, 'X-Naver-Client-Secret': client_secret}
     };
    request.get(options, function (error, response, body) {
      if (!error && response.statusCode == 200) {
        res.writeHead(200, {'Content-Type': 'text/json;charset=utf-8'});
        res.end(body);
      } else {
        res.status(response.statusCode).end();
        console.log('error = ' + response.statusCode);
      }
    });
};



exports.member = async function (req, res) {
  let header = "Bearer " + req.headers['access-token'];
  let api_url = 'https://openapi.naver.com/v1/nid/me';
  let request = require('request');
  let options = {
       url: api_url,
       headers: {'Authorization': header}
    };
    
   request.get(options, async function (error, responses, body) {

     if (!error && responses.statusCode == 200) {
       const temp = await JSON.parse(body);
       
       try {
            const phoneNumber = await temp.response.mobile.replace(/\-/g,'');
            const phoneRows = await naverDao.userPhoneCheck(phoneNumber);

            if (!(phoneRows.length > 0)) {
            const nickName = await Math.floor(Math.random() * 1000);
            const insertUserInfoParams = [phoneNumber,nickName];
            const insertUserRows = await naverDao.insertUserInfo(insertUserInfoParams);
            const [userInfoRows] = await naverDao.selectUserInfo(phoneNumber);

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
                jwt: token,
                "newUser" : true,
                isSuccess: true,
                code: 1000,
                message: "신규 회원 네이버 로그인 성공"
            });
            }

            else{

                const [userInfoRows] = await naverDao.selectUserInfo(phoneNumber);

                if (userInfoRows[0].status === "DEACTIVE") {

                    return res.json({
                        isSuccess: false,
                        code: 3200,
                        message: "비활성화 된 계정입니다. 고객센터에 문의해주세요."
                    });
                } else if (userInfoRows[0].status === "DELETED") {

                    return res.json({
                        isSuccess: false,
                        code: 3201,
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
                        jwt: token,
                        "newUser" : false,
                        isSuccess: true,
                        code: 1000,
                        message: "기존 회원 네이버 로그인 성공"
                    });
            }
            
        } catch (err) {
            logger.error(`App - login Query error\n: ${err.message}`);
            return res.json({
                isSuccess: false,
                code: 2000,
                message: "네이버 로그인 실패",
            });
        }
     } else {
       if(responses != null) {
         console.log('error = ' + responses.statusCode);
         return res.json({
          isSuccess: false,
          code: 3203,
          message: "네이버 토큰이 유효하지 않습니다!"
        });
       }
     }
   });
};