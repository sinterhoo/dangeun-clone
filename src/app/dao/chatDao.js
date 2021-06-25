const { pool } = require("../../../config/database");



//상품 거래 가능 범위 조회
async function getItemInfo(itemId) {
  const connection = await pool.getConnection(async (conn) => conn);
  const itemInfoQuery = `
  SELECT item.locationDistance as level,location.latitude,location.logitude FROM item
  JOIN location on location.id = item.locationId
  WHERE item.id = ${itemId};
  `;
  const [itemInfoRows] = await connection.query(
    itemInfoQuery
  );
  connection.release();
  return itemInfoRows;
}

// 거래 가능지역인지 확인
async function checkLocationInfo(level,lati,logi,userId) {
  const connection = await pool.getConnection(async (conn) => conn);
  const locationInfoQuery = `
  SELECT user.id, user.nickname,location.name FROM user
  JOIN userlocation on userlocation.userId = user.id
  JOIN location on location.id = userlocation.locationId
  JOIN (SELECT id,name,
                      (6371 *
                       acos(cos(radians(${lati})) * cos(radians(lo.latitude)) * cos(radians(lo.logitude)
                           - radians(${logi})) + sin(radians(${lati})) * sin(radians(lo.latitude))))
                          AS distance
               FROM location as lo
               HAVING distance <= ${level}
               ORDER BY distance) dian on dian.id = userlocation.locationId
  where user.id = ${userId} and userlocation.isCertified = 'Y';
  `;
  const [locationInfoRows] = await connection.query(
    locationInfoQuery
  );
  connection.release();
  return locationInfoRows;
}

// 채팅방 생성하기
async function makeChatroom(itemId, userId) {
  try{
  const connection = await pool.getConnection(async (conn) => conn);
  try{
    await connection.beginTransaction(); // START TRANSACTION
    const checkChatroomQuery = `
    SELECT id as chatroomId FROM chatroom WHERE itemId = ${itemId} AND buyerId = ${userId} AND isDeleted = 'N';
    `;
    const [checkChatroomRows] = await connection.query(
      checkChatroomQuery
    );
    if(checkChatroomRows.length < 1){
      const insertChatroomQuery = `
      INSERT INTO chatroom(itemId, buyerId) VALUES (${itemId},${userId});
    `;
    const [insertChatroomRows] = await connection.query(
      insertChatroomQuery
    );
    }
    const chatroomInfoQuery = `
    SELECT id as chatroomId FROM chatroom WHERE itemId = ${itemId} AND buyerId = ${userId} AND isDeleted = 'N';
    `;
    const [chatroomInfoRows] = await connection.query(
      chatroomInfoQuery
    );
    await connection.commit(); // COMMIT
    connection.release();
    return chatroomInfoRows;
  }catch(err){
             await connection.rollback(); // ROLLBACK
            connection.release();
            logger.error(`chatroom insert Query error\n: ${JSON.stringify(err)}`);
            return false;
  }
}catch(err){
    logger.error(`chatroom insert DB Connection error\n: ${JSON.stringify(err)}`);
    return false;
}
}

// 빈 채팅방 뒤로가기하면 삭제
async function emptyChatroom(chatroomId) {
  try{
  const connection = await pool.getConnection(async (conn) => conn);
  try{
    await connection.beginTransaction(); // START TRANSACTION
    const checkChatroomQuery = `
    SELECT * FROM message WHERE chatroomId = ${chatroomId};
    `;
    const [checkChatroomRows] = await connection.query(
      checkChatroomQuery
    );
    
    if(checkChatroomRows.length < 1){
      const deleteChatroomQuery = `
      DELETE FROM chatroom where id = ${chatroomId};
    `;
    const [deleteChatroomRows] = await connection.query(
      deleteChatroomQuery
    );
    }
    
    await connection.commit(); // COMMIT
    connection.release();
    return checkChatroomRows;
  }catch(err){
             await connection.rollback(); // ROLLBACK
            connection.release();
            logger.error(`empty chatroom delete Query error\n: ${JSON.stringify(err)}`);
            return false;
  }
}catch(err){
    logger.error(`empty chatroom delete DB Connection error\n: ${JSON.stringify(err)}`);
    return false;
}
}

//전체 채팅방 조회
async function getChatroomAll(userId) {
  const connection = await pool.getConnection(async (conn) => conn);
  const allChatroomInfoQuery = `
  SELECT chatroom.id as chatroomId,
       user.id as userId,
       user.mannerMeter,
       user.profilePhotoUrl,
       user.nickname,
       (SELECT substring_index(name, ',', 1)
        FROM Location
                 JOIN userlocation
                      ON userlocation.locationId = location.id
        WHERE userlocation.userId = user.id
          AND userlocation.isChecked = 'Y')                                        as location,
       IFNULL((SELECT photoUrl FROM itemmedia where itemId = item.id LIMIT 1), '') as img,
       (SELECT contents
        FROM message
        WHERE message.chatroomId = chatroom.id
        order by message.createdAt DESC
        LIMIT 1)                                                                   as lastMessage,
       (SELECT if(TIMESTAMPDIFF(day, message.createdAt, NOW()) > 0,
                  concat(TIMESTAMPDIFF(day, message.createdAt, NOW()), '일 전'),
                  if(DATE_FORMAT(message.createdAt, '%p') = 'AM', concat(DATE_FORMAT(message.createdAt, '%h:%i'), ' 오전')
                      , concat(DATE_FORMAT(message.createdAt, '%h:%i'), ' 오후')))
        FROM message
        WHERE message.chatroomId = chatroom.id
        order by message.createdAt DESC
        LIMIT 1)                                                                   as times,
       (SELECT count(isSeen) FROM message WHERE NOT senderId = ${userId} AND message.chatroomId = chatroom.id AND isSeen = 'N') as seenCount
FROM chatroom
         JOIN item on item.id = chatroom.itemId
         JOIN user on user.id = if(chatroom.buyerId = ${userId}, item.userId, chatroom.buyerId)
WHERE chatroom.isDeleted = 'N' AND (item.userId = ${userId}
   OR chatroom.buyerId = ${userId})
   ORDER BY (SELECT message.createdAt FROM message WHERE message.chatroomId = chatroom.id order by message.createdAt
    DESC LIMIT 1) DESC; 
  `;
  const [allChatroomInfoRows] = await connection.query(
    allChatroomInfoQuery
  );
  connection.release();
  return allChatroomInfoRows;
}

//채팅방 유저 접근 권한 조회
async function getCheckUserInfo(chatroomId) {
  const connection = await pool.getConnection(async (conn) => conn);
  const checkUserInfoQuery = `
  SELECT item.userId, chatroom.buyerId FROM chatroom
JOIN item on item.id = chatroom.itemId
WHERE chatroom.id = ${chatroomId} AND chatroom.isDeleted = 'N';
  `;
  const [checkUserInfoRows] = await connection.query(
    checkUserInfoQuery
  );
  connection.release();
  return checkUserInfoRows;
}

//채팅방 상단 상품 정보 조회
async function getTopChatroomInfo(chatroomId) {
  const connection = await pool.getConnection(async (conn) => conn);
  const topChatroomInfoQuery = `
  SELECT IFNULL((SELECT photoUrl FROM itemmedia where itemId = item.id LIMIT 1), '') as img,
  item.id,
       item.title,item.price FROM chatroom
JOIN item on item.id = chatroom.itemId
WHERE chatroom.id = ${chatroomId};
  `;
  const [topChatroomInfoRows] = await connection.query(
    topChatroomInfoQuery
  );
  connection.release();
  return topChatroomInfoRows;
}

// 채팅방 상세 조회
async function getChatroomDetailInfo(chatroomId,userId) {
  try{
  const connection = await pool.getConnection(async (conn) => conn);
  try{
    await connection.beginTransaction(); // START TRANSACTION
    const checkMessageQuery = `
    UPDATE message SET isSeen = 'Y' WHERE chatroomId = ${chatroomId} AND NOT senderId = ${userId};
    `;
    const [checkMessageRows] = await connection.query(
      checkMessageQuery
    );
    
    
    const getChatroomDetailQuery = `
      SELECT user.profilePhotoUrl,message.senderId,message.contents,
      if(DATE_FORMAT(message.createdAt, '%p') = 'AM', concat(DATE_FORMAT(message.createdAt, '%h:%i'), ' 오전')
                      , concat(DATE_FORMAT(message.createdAt, '%h:%i'), ' 오후')) as messageTime,
                      message.createdAt,message.isSeen,
      if(message.senderId = ${userId},'Y','N') as isMyself FROM message
      JOIN user ON user.id = message.senderId
      WHERE message.chatroomId = ${chatroomId}
      ORDER BY createdAt;
    `;
    const [getChatroomDetailRows] = await connection.query(
      getChatroomDetailQuery
    );
    
    await connection.commit(); // COMMIT
    connection.release();
    return getChatroomDetailRows;
  }catch(err){
             await connection.rollback(); // ROLLBACK
            connection.release();
            logger.error(`get chatroom detail Info Query error\n: ${JSON.stringify(err)}`);
            return false;
  }
}catch(err){
    logger.error(`get chatroom detail Info DB Connection error\n: ${JSON.stringify(err)}`);
    return false;
}
}

// 메시지 전송
async function postMessageInfo(userId,chatroomId,contents) {
  const connection = await pool.getConnection(async (conn) => conn);
  const postMessageInfoQuery = `
  INSERT INTO message(chatroomId,senderId,contents,type) VALUES
   (${chatroomId},${userId},'${contents}','TEXT');
  `;
  const [postMessageInfoRows] = await connection.query(
    postMessageInfoQuery
  );
  connection.release();
  return postMessageInfoRows;
}

// 채팅방 나가기
async function deleteChatroomInfo(chatroomId) {
  const connection = await pool.getConnection(async (conn) => conn);
  const deleteChatroomInfoQuery = `
  UPDATE chatroom SET isDeleted = 'Y' where id = ${chatroomId};
  `;
  const [deleteChatroomInfoRows] = await connection.query(
    deleteChatroomInfoQuery
  );
  connection.release();
  return deleteChatroomInfoRows;
}

module.exports = {
  getItemInfo,
  checkLocationInfo,
  makeChatroom,
  emptyChatroom,
  getChatroomAll,
  getCheckUserInfo,
  getTopChatroomInfo,
  getChatroomDetailInfo,
  postMessageInfo,
  deleteChatroomInfo
};
