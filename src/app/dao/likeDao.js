const { pool } = require("../../../config/database");



//상품이 찜 되어있는지 조회(검색용)
async function getLikeInfo(userId,itemId) {
  const connection = await pool.getConnection(async (conn) => conn);
  const getLikeInfoQuery = `
  SELECT userId,itemId,isLike FROM likes
  WHERE userId = ${userId} AND itemId = ${itemId};
  `;
  const [getLikeInfoRows] = await connection.query(
    getLikeInfoQuery
  );
  connection.release();
  return getLikeInfoRows;
}

//테이블에 없으면 생성(첫 찜)
async function insertLikeInfo(userId,itemId) {
  const connection = await pool.getConnection(async (conn) => conn);
  const insertLikeInfoQuery = `
  INSERT INTO likes (userId, itemId) VALUES (${userId},${itemId});
  `;
  const [insertLikeInfoRows] = await connection.query(
    insertLikeInfoQuery
  );
  connection.release();
  return insertLikeInfoRows;
}

//테이블에 있으면 찜 되어있으면 해제 해제되어 있으면 찜
async function setLikeInfo(userId,itemId,str) {
  const connection = await pool.getConnection(async (conn) => conn);
  const setLikeInfoQuery = `
  UPDATE likes SET isLike = '${str}' WHERE userId = ${userId} AND itemId = ${itemId};
  `;
  const [setLikeInfoRows] = await connection.query(
    setLikeInfoQuery
  );
  connection.release();
  return setLikeInfoRows;
}


//찜한 상품 조회
async function getLikeItemInfo(userId) {
  const connection = await pool.getConnection(async (conn) => conn);
  const getLikeInfoQuery = `
  SELECT item.id,
       item.categoryId,
       item.status,
       IFNULL((SELECT photoUrl FROM itemmedia where itemId = item.id LIMIT 1), '')              as img,
       item.title,
       substring_index((SELECT name FROM location WHERE location.id = item.locationId), ',', 1) as location,
       if(item.isBoosted = 'N', (case
                                     when timestampdiff(minute, item.createdAt, now()) < 60
                                         then concat(timestampdiff(minute, item.createdAt, now()), '분 전')
                                     when timestampdiff(hour, item.createdAt, now()) < 24
                                         then concat(timestampdiff(hour, item.createdAt, now()), '시간 전')
                                     else concat(timestampdiff(day, item.createdAt, now()), '일 전')
           END), concat('끌올 ',
                        (case
                             when timestampdiff(minute, item.boostTime, now()) < 60
                                 then concat(timestampdiff(minute, item.boostTime, now()), '분 전')
                             when timestampdiff(hour, item.boostTime, now()) < 24
                                 then concat(timestampdiff(hour, item.boostTime, now()), '시간 전')
                             else concat(timestampdiff(day, item.boostTime, now()), '일 전')
                            END)))                                                              as time,
       item.price,
       (SELECT count(itemId) FROM likes WHERE likes.itemId = item.id)                           as likes,
       (SELECT count(itemId) FROM chatroom WHERE chatroom.itemId = item.id)                     as chat
  FROM item
  JOIN likes on likes.itemId = item.id
  WHERE likes.userId = ${userId} AND likes.isLike = 'Y'
  order by item.boostTime desc;
  `;
  const [getLikeInfoRows] = await connection.query(
    getLikeInfoQuery
  );
  connection.release();
  return getLikeInfoRows;
}


//유저가 팔로우 되어있는지 조회(검색용)
async function getUserLikeInfo(userId,otherId) {
  const connection = await pool.getConnection(async (conn) => conn);
  const getUserLikeInfoQuery = `
  select userId, followUserId, isFollow FROM follow
  where userId = ${userId} AND followUserId = ${otherId};
  `;
  const [getUserLikeInfoRows] = await connection.query(
    getUserLikeInfoQuery
  );
  connection.release();
  return getUserLikeInfoRows;
}

//테이블에 없으면 생성(첫 팔로우)
async function insertUserLikeInfo(userId,otherId) {
  const connection = await pool.getConnection(async (conn) => conn);
  const insertUserLikeInfoQuery = `
  INSERT INTO follow(userId,followUserId) VALUES (${userId},${otherId});
  `;
  const [insertUserLikeInfoRows] = await connection.query(
    insertUserLikeInfoQuery
  );
  connection.release();
  return insertUserLikeInfoRows;
}

//테이블에 있으면 팔로우 되어있으면 해제, 해제되어 있으면 팔로우
async function setUserLikeInfo(userId,otherId,str) {
  const connection = await pool.getConnection(async (conn) => conn);
  const setUserLikeInfoQuery = `
  UPDATE follow SET isFollow = '${str}' WHERE userId = ${userId} AND followUserId = ${otherId};
  `;
  const [setUserLikeInfoRows] = await connection.query(
    setUserLikeInfoQuery
  );
  connection.release();
  return setUserLikeInfoRows;
}


//찜한 상품 조회
async function getLikeUserInfo(userId) {
  const connection = await pool.getConnection(async (conn) => conn);
  const getLikeUserInfoQuery = `
  SELECT item.id,
       item.categoryId,
       item.status,
       IFNULL((SELECT photoUrl FROM itemmedia where itemId = item.id LIMIT 1), '')              as img,
       item.title,
       substring_index((SELECT name FROM location WHERE location.id = item.locationId), ',', 1) as location,
       user.nickname,
       item.price
  FROM item
  join user on user.id = item.userId
  JOIN follow on follow.followUserId = item.userId
  WHERE follow.userId = ${userId} AND follow.isFollow = 'Y'
  order by item.boostTime desc;
  `;
  const [getLikeUserInfoRows] = await connection.query(
    getLikeUserInfoQuery
  );
  connection.release();
  return getLikeUserInfoRows;
}

module.exports = {
  getLikeInfo,
  insertLikeInfo,
  setLikeInfo,
  getLikeItemInfo,
  getUserLikeInfo,
  insertUserLikeInfo,
  setUserLikeInfo,
  getLikeUserInfo
};
