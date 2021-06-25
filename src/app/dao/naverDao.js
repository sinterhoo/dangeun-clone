const { pool } = require("../../../config/database");

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



module.exports = {
  userPhoneCheck,
  insertUserInfo,
  selectUserInfo
};
