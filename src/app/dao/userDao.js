const { pool } = require("../../../config/database");

// 인증번호 발송시 저장
async function insertAuthNum(user_phone_number,user_auth_number) {
  const connection = await pool.getConnection(async (conn) => conn);
  const insertSmsInfoQuery = `
        INSERT INTO Smscheck(phoneNumber, authNumber)
        VALUES ('${user_phone_number}', ${user_auth_number});
    `;
  const insertSmsInfoRow = await connection.query(
    insertSmsInfoQuery
  );
  connection.release();
  return insertSmsInfoRow;
}

// 인증번호 검증
async function userSmsCheck(phone,auth) {
  const connection = await pool.getConnection(async (conn) => conn);
  const selectSmsQuery = `
                SELECT id 
                FROM smscheck 
                WHERE phoneNumber = '${phone}' AND authNumber = '${auth}';
                `;
  const [smsRows] = await connection.query(
    selectSmsQuery
  );
  connection.release();

  return smsRows;
}

// 인증번호 삭제
async function deleteSmsCheck(phone) {
  const connection = await pool.getConnection(async (conn) => conn);
  const deleteSmsQuery = `
                DELETE FROM smscheck
                WHERE phoneNumber = '${phone}'
                `;
  const [smsRows] = await connection.query(
    deleteSmsQuery
  );
  connection.release();

  return smsRows;
}



// Signup
async function userPhoneCheck(phone) {
  const connection = await pool.getConnection(async (conn) => conn);
  const selectPhoneQuery = `
                SELECT id 
                FROM User 
                WHERE phoneNumber = ?;
                `;
  const selectPhoneParams = [phone];
  const [phoneRows] = await connection.query(
    selectPhoneQuery,
    selectPhoneParams
  );
  connection.release();

  return phoneRows;
}

async function insertUserInfo(insertUserInfoParams) {
  const connection = await pool.getConnection(async (conn) => conn);
  const insertUserInfoQuery = `
        INSERT INTO User(phoneNumber, nickname, profilePhotoUrl)
        VALUES (?, ?, 'default');
    `;
  const insertUserInfoRow = await connection.query(
    insertUserInfoQuery,
    insertUserInfoParams
  );
  connection.release();
  return insertUserInfoRow;
}

//SignIn
async function selectUserInfo(phone) {
  const connection = await pool.getConnection(async (conn) => conn);
  const selectUserInfoQuery = `
                SELECT id, nickname, status 
                FROM User 
                WHERE phoneNumber = ?;
                `;

  let selectUserInfoParams = [phone];
  const [userInfoRows] = await connection.query(
    selectUserInfoQuery,
    selectUserInfoParams
  );
  connection.release();
  return [userInfoRows];
}

// get user info
async function getUserProfileInfo(userId) {
  const connection = await pool.getConnection(async (conn) => conn);
  const getUserProfileInfoQuery = `
                SELECT *
                FROM (
                    SELECT profilePhotoUrl, nickname, id AS userCode, mannerMeter, date_format(createdAt, '%Y년 %m월 %d일') AS createdAt
                    FROM User
                    WHERE id = ?
                    ) AS u
                JOIN (
                    SELECT *
                    FROM (
                        SELECT COUNT(*) AS numItems
                        FROM item
                        WHERE userId = ?
                        ) AS i
                    JOIN (
                        SELECT *
                        FROM (
                            SELECT COUNT(*) AS numBadges
                            FROM userbadges
                            WHERE userId = ?
                            ) AS b
                        JOIN (
                            SELECT COUNT(*) AS numReviews
                            FROM review
                            WHERE itemId IN (
                                SELECT id
                                FROM item
                                WHERE item.userId = ?
                            )
                        ) AS r
                    ) AS br
                ) AS n;
                `;

  let getUserProfileInfoParams = [userId, userId, userId, userId];
  const [getUserProfileInfoRows] = await connection.query(
    getUserProfileInfoQuery,
    getUserProfileInfoParams
  );
  connection.release();
  return [getUserProfileInfoRows];
}

async function getUserReviewInfo(userId) {
  const connection = await pool.getConnection(async (conn) => conn);
  const getUserReviewInfoQuery = `
                SELECT nickname, name AS location, date_format(createdAt, '%Y년 %m월 %d일'), contents
                FROM (
                    SELECT nickname, locationId, createdAt, contents
                    FROM (
                        SELECT userId, locationId, createdAt, contents
                        FROM review
                        WHERE itemId IN (
                            SELECT id
                            FROM item
                            WHERE item.userId = ?
                        )
                    ) AS r
                    INNER JOIN (
                        SELECT id, nickname
                        FROM user
                        WHERE id IN (
                            SELECT userId
                            FROM review
                            WHERE itemId IN (
                                SELECT id
                                FROM item
                                WHERE item.userId = ?
                            )
                        )
                    ) AS u
                    ON r.userId = u.id
                    ) AS ru
                INNER JOIN (
                    SELECT id, name
                    FROM location
                    WHERE id IN (
                        SELECT locationId
                        FROM review
                        WHERE itemId IN (
                            SELECT id
                            FROM item
                            WHERE item.userId = ?
                        )
                    )
                ) AS l
                ON ru.locationId = l.id;
                `;

  let getUserReviewInfoParams = [userId, userId, userId];
  const [getUserReviewInfoRows] = await connection.query(
    getUserReviewInfoQuery,
    getUserReviewInfoParams
  );
  connection.release();
  return [getUserReviewInfoRows];
}

async function getUserLocationInfo(userId) {
  const connection = await pool.getConnection(async (conn) => conn);
  const getUserLocationInfoQuery = `
                SELECT name
                FROM (
                    SELECT id, name
                    FROM location
                    WHERE id IN (
                        SELECT locationId
                        FROM userlocation
                        WHERE userId = ?
                        )
                    ) AS l
                INNER JOIN (
                    SELECT locationId, updatedAt
                    FROM userlocation
                    WHERE userId = ?
                    ) AS u
                ON l.id = u.locationId
                ORDER BY updatedAt DESC;
                `;

  let getUserLocationInfoParams = [userId, userId];
  const [getUserLocationInfoRows] = await connection.query(
    getUserLocationInfoQuery,
    getUserLocationInfoParams
  );
  connection.release();
  return [getUserLocationInfoRows];
}

async function getUserFeedbackInfo(userId) {
  const connection = await pool.getConnection(async (conn) => conn);
  const getUserFeedbackInfoQuery = `
                SELECT numFeedback, contents
                FROM (
                    SELECT COUNT(*) AS numFeedback, negativeFeedbackId
                    FROM usernegativefeedback
                    WHERE reviewedUserId = ?
                    GROUP BY negativeFeedbackId
                    ) AS nn
                INNER JOIN (
                    SELECT id, title AS contents
                    FROM negativefeedback
                    WHERE id IN (
                        SELECT negativeFeedbackId
                        FROM usernegativefeedback
                        WHERE reviewedUserId = ?
                        GROUP BY negativeFeedbackId
                        )
                    ) AS nc
                ON nn.negativeFeedbackId = nc.id;
                `;

  let getUserFeedbackInfoParams = [userId, userId];
  const [getUserFeedbackInfoRows] = await connection.query(
    getUserFeedbackInfoQuery,
    getUserFeedbackInfoParams
  );
  connection.release();
  return [getUserFeedbackInfoRows];
}

//edit user profile info
async function editUserProfileInfo(editUserProfileInfoParams) {
  const connection = await pool.getConnection(async (conn) => conn);
  const editUserProfileInfoQuery = `
                UPDATE user
                SET profilePhotoUrl = ?, nickname = ?
                WHERE id = ?;
                `;

  const [editUserProfileInfoRows] = await connection.query(
    editUserProfileInfoQuery,
    editUserProfileInfoParams
  );
  connection.release();
  return editUserProfileInfoRows;
}

//delete account
async function deleteUserInfo(userId) {
  const connection = await pool.getConnection(async (conn) => conn);
  const deleteUserInfoQuery = `
                UPDATE user
                SET status = 'DELETED'
                WHERE id = ?;
                `;

  let deleteUserInfoParams = [userId];
  const [deleteUserInfoRows] = await connection.query(
    deleteUserInfoQuery,
    deleteUserInfoParams
  );
  connection.release();
  return deleteUserInfoRows;
}

//delete account
async function getTests() {
  const connection = await pool.getConnection(async (conn) => conn);
  const deleteUserInfoQuery = `
                SELECT * FROM user WHERE id = 8;
                `;

  const [deleteUserInfoRows] = await connection.query(
    deleteUserInfoQuery
  );
  console.log(deleteUserInfoRows);
  connection.release();
  return deleteUserInfoRows;
}

module.exports = {
  insertAuthNum,
  userSmsCheck,
  deleteSmsCheck,
  userPhoneCheck,
  insertUserInfo,
  selectUserInfo,
  getUserProfileInfo,
  getUserReviewInfo,
  getUserLocationInfo,
  getUserFeedbackInfo,
  editUserProfileInfo,
  deleteUserInfo,
  getTests
};
