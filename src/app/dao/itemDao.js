const { pool } = require("../../../config/database");

/*

카테고리 예외처리 모듈화

*/

//위치 정보 조회(검색용)
async function getLocation(userInfo) {
  const connection = await pool.getConnection(async (conn) => conn);
  const locationInfoQuery = `
  SELECT userlocation.locationId, userlocation.isCertified,userlocation.level, location.latitude, location.logitude FROM location
  JOIN userlocation on userlocation.locationId = location.id
  WHERE userlocation.userId = ? AND userlocation.isChecked = 'Y';
  `;
  const [locationInfoRows] = await connection.query(
    locationInfoQuery,
    userInfo
  );
  connection.release();
  return locationInfoRows;
}
// 카테고리 예외처리
async function checkCategory(category) {
  for(var i=0; i < category.length; i++){
    if(isNaN(category[i])){
      return false;
    }
  }
  return true;
}

//메인 화면 조회
async function getBoardMain(level,lati,logi,categoryIdx,page,size) {
  const connection = await pool.getConnection(async (conn) => conn);
  const getBoardMainInfoQuery = `
  SELECT item.id, item.categoryId, item.status,
  IFNULL((SELECT photoUrl FROM itemmedia where itemId = item.id LIMIT 1), '') as img,
       item.title,
       substring_index((SELECT name FROM location WHERE location.id = item.locationId) , ',', 1)                                      as location,
       if(item.isBoosted = 'N', (case
                                     when timestampdiff(minute, item.createdAt, now()) < 60
                                         then concat(timestampdiff(minute, item.createdAt, now()), '분 전')
                                     when timestampdiff(hour, item.createdAt, now()) < 24
                                         then concat(timestampdiff(hour, item.createdAt, now()), '시간 전')
                                     else concat(timestampdiff(day, item.createdAt, now()), '일 전')
           END),
          (case
               when timestampdiff(minute, item.boostTime, now()) < 60
                   then concat('끌올 ', timestampdiff(minute, item.boostTime, now()), '분 전')
               when timestampdiff(hour, item.boostTime, now()) < 24
                   then concat('끌올 ', timestampdiff(hour, item.boostTime, now()), '시간 전')
               else concat('끌올 ', timestampdiff(day, item.boostTime, now()), '일 전')
              END))                                                                as time,
       item.price,
       (SELECT count(itemId) FROM likes WHERE likes.itemId = item.id)              as likes,
       (SELECT count(itemId) FROM chatroom WHERE chatroom.itemId = item.id) as chat
  FROM item
          JOIN (SELECT *,
                        (6371 *
                        acos(cos(radians(${lati})) * cos(radians(location.latitude)) * cos(radians(location.logitude)
                            - radians(${logi})) + sin(radians(${lati})) * sin(radians(location.latitude))))
                            AS distance
                FROM location
                HAVING distance <= ${level}
                ORDER BY distance) as distance on distance.id = item.locationId
  where item.categoryId NOT IN (${categoryIdx}) AND distance.distance <= item.locationDistance
  order by item.boostTime desc
  LIMIT ${page},${size};
                `;
  const [getMainInfoRows] = await connection.query(
    getBoardMainInfoQuery
  );
  connection.release();
  return getMainInfoRows;
}

// 모든 상품 조회
async function getAllBoard(userIdx) {
  const connection = await pool.getConnection(async (conn) => conn);
  const allInfoQuery = `
  SELECT item.id, item.categoryId,item.status,
  IFNULL((SELECT photoUrl FROM itemmedia where itemId = item.id LIMIT 1), '') as img,
       item.title,
       substring_index((SELECT name FROM location WHERE location.id = item.locationId) , ',', 1)   as location,
       if(item.isBoosted = 'N', (case
                                     when timestampdiff(minute, item.createdAt, now()) < 60
                                         then concat(timestampdiff(minute, item.createdAt, now()), '분 전')
                                     when timestampdiff(hour, item.createdAt, now()) < 24
                                         then concat(timestampdiff(hour, item.createdAt, now()), '시간 전')
                                     else concat(timestampdiff(day, item.createdAt, now()), '일 전')
           END),
          (case
               when timestampdiff(minute, item.boostTime, now()) < 60
                   then concat('끌올 ', timestampdiff(minute, item.boostTime, now()), '분 전')
               when timestampdiff(hour, item.boostTime, now()) < 24
                   then concat('끌올 ', timestampdiff(hour, item.boostTime, now()), '시간 전')
               else concat('끌올 ', timestampdiff(day, item.boostTime, now()), '일 전')
              END))                                                                as time,
       item.price,
       (SELECT count(itemId) FROM likes WHERE likes.itemId = item.id)              as likes,
       (SELECT count(itemId) FROM chatroom WHERE chatroom.itemId = item.id) as chat,
       if(item.status = 'RESERVATION','Y','N') as reservation
  FROM item
      where item.userId = ? AND NOT item.status = 'HIDDEN'
  order by time desc;
  `;
  const [allInfoRows] = await connection.query(
    allInfoQuery,
    userIdx
  );
  connection.release();
  return allInfoRows;
}


// 판매중 상품 조회
async function getOnSaleBoard(userIdx) {
  const connection = await pool.getConnection(async (conn) => conn);
  const onSaleInfoQuery = `
  SELECT item.id, item.categoryId,item.status,
  IFNULL((SELECT photoUrl FROM itemmedia where itemId = item.id LIMIT 1), '') as img,
       item.title,
       substring_index((SELECT name FROM location WHERE location.id = item.locationId) , ',', 1)   as location,
       if(item.isBoosted = 'N', (case
                                     when timestampdiff(minute, item.createdAt, now()) < 60
                                         then concat(timestampdiff(minute, item.createdAt, now()), '분 전')
                                     when timestampdiff(hour, item.createdAt, now()) < 24
                                         then concat(timestampdiff(hour, item.createdAt, now()), '시간 전')
                                     else concat(timestampdiff(day, item.createdAt, now()), '일 전')
           END),
          (case
               when timestampdiff(minute, item.boostTime, now()) < 60
                   then concat('끌올 ', timestampdiff(minute, item.boostTime, now()), '분 전')
               when timestampdiff(hour, item.boostTime, now()) < 24
                   then concat('끌올 ', timestampdiff(hour, item.boostTime, now()), '시간 전')
               else concat('끌올 ', timestampdiff(day, item.boostTime, now()), '일 전')
              END))                                                                as time,
       item.price,
       (SELECT count(itemId) FROM likes WHERE likes.itemId = item.id)              as likes,
       (SELECT count(itemId) FROM chatroom WHERE chatroom.itemId = item.id) as chat,
       if(item.status = 'RESERVATION','Y','N') as reservation
  FROM item
      where item.userId = ? AND (item.status = 'ONSALE' OR item.status = 'RESERVATION')
  order by time desc;
  `;
  const [onSaleInfoRows] = await connection.query(
    onSaleInfoQuery,
    userIdx
  );
  connection.release();
  return onSaleInfoRows;
}

// 거래완료 상품 조회
async function getCompletionBoard(userIdx) {
  const connection = await pool.getConnection(async (conn) => conn);
  const completionInfoQuery = `
  SELECT item.id, item.categoryId,item.status,
  IFNULL((SELECT photoUrl FROM itemmedia where itemId = item.id LIMIT 1), '') as img,
       item.title,
       substring_index((SELECT name FROM location WHERE location.id = item.locationId) , ',', 1)   as location,
       if(item.isBoosted = 'N', (case
                                     when timestampdiff(minute, item.createdAt, now()) < 60
                                         then concat(timestampdiff(minute, item.createdAt, now()), '분 전')
                                     when timestampdiff(hour, item.createdAt, now()) < 24
                                         then concat(timestampdiff(hour, item.createdAt, now()), '시간 전')
                                     else concat(timestampdiff(day, item.createdAt, now()), '일 전')
           END),
          (case
               when timestampdiff(minute, item.boostTime, now()) < 60
                   then concat('끌올 ', timestampdiff(minute, item.boostTime, now()), '분 전')
               when timestampdiff(hour, item.boostTime, now()) < 24
                   then concat('끌올 ', timestampdiff(hour, item.boostTime, now()), '시간 전')
               else concat('끌올 ', timestampdiff(day, item.boostTime, now()), '일 전')
              END))                                                                as time,
       item.price,
       (SELECT count(itemId) FROM likes WHERE likes.itemId = item.id)              as likes,
       (SELECT count(itemId) FROM chatroom WHERE chatroom.itemId = item.id) as chat
  FROM item
      where item.userId = ? AND item.status = 'COMPLETED'
  order by time desc;
  `;
  const [completionInfoRows] = await connection.query(
    completionInfoQuery,
    userIdx
  );
  connection.release();
  return completionInfoRows;
}

// 숨김 상품 조회
async function getHideBoard(userIdx) {
  const connection = await pool.getConnection(async (conn) => conn);
  const hideInfoQuery = `
  SELECT item.id, item.categoryId, item.status,
  IFNULL((SELECT photoUrl FROM itemmedia where itemId = item.id LIMIT 1), '') as img,
       item.title,
       substring_index((SELECT name FROM location WHERE location.id = item.locationId) , ',', 1)   as location,
       if(item.isBoosted = 'N', (case
                                     when timestampdiff(minute, item.createdAt, now()) < 60
                                         then concat(timestampdiff(minute, item.createdAt, now()), '분 전')
                                     when timestampdiff(hour, item.createdAt, now()) < 24
                                         then concat(timestampdiff(hour, item.createdAt, now()), '시간 전')
                                     else concat(timestampdiff(day, item.createdAt, now()), '일 전')
           END),
          (case
               when timestampdiff(minute, item.boostTime, now()) < 60
                   then concat('끌올 ', timestampdiff(minute, item.boostTime, now()), '분 전')
               when timestampdiff(hour, item.boostTime, now()) < 24
                   then concat('끌올 ', timestampdiff(hour, item.boostTime, now()), '시간 전')
               else concat('끌올 ', timestampdiff(day, item.boostTime, now()), '일 전')
              END))                                                                as time,
       item.price,
       (SELECT count(itemId) FROM likes WHERE likes.itemId = item.id)              as likes,
       (SELECT count(itemId) FROM chatroom WHERE chatroom.itemId = item.id) as chat,
       if(item.status = 'RESERVATION','Y','N') as reservation
  FROM item
      where item.userId = ? AND item.status = 'HIDDEN'
  order by time desc;
  `;
  const [hideInfoRows] = await connection.query(
    hideInfoQuery,
    userIdx
  );
  connection.release();
  return hideInfoRows;
}

//상품 올린 유저인지 체크
async function checkItemUser(itemInfo) {
  const connection = await pool.getConnection(async (conn) => conn);
  const userInfoQuery = `
  SELECT userId,timestampdiff(hour,boostTime,now()) as times FROM item where id = ?;
  `;
  const [userInfoRows] = await connection.query(
    userInfoQuery,
    itemInfo
  );
  connection.release();
  return userInfoRows;
}


//상품 상태 변경
async function changeItemInfo(status,itemIdx) {
  const connection = await pool.getConnection(async (conn) => conn);
  const itemChangeQuery = `
  UPDATE item SET status = '${status}' WHERE id = ${itemIdx};
  `;
  const [itemChangeRows] = await connection.query(
    itemChangeQuery
  );
  connection.release();
  return itemChangeRows;
}

//상품 끌어올리기
async function boostItemInfo(itemIdx) {
  const connection = await pool.getConnection(async (conn) => conn);
  const itemBoostQuery = `
  UPDATE item SET isBoosted = 'Y', boostTime = NOW() WHERE id = ${itemIdx};
  `;
  const [itemBoostRows] = await connection.query(
    itemBoostQuery
  );
  connection.release();
  return itemBoostRows;
}

//상품 상세 페이지 조회
async function getItemDetailInfo(userId,itemId) {
  try{
    const connection = await pool.getConnection(async (conn) => conn);
    try{
      await connection.beginTransaction(); // START TRANSACTION
      const itemDetailQuery = `
      SELECT item.userId,
       item.categoryId,
       itemCategory.categoryName,
       user.profilePhotoUrl, user.nickname, user.mannerMeter,
       substring_index(location.name, ',', 1) as location,
       item.title,itemcategory.categoryName, if(item.isBoosted = 'N', (case
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
       item.contents,
       (SELECT count(itemId) FROM likes WHERE likes.itemId = item.id)                           as likes,
       (SELECT count(itemId) FROM chatroom WHERE chatroom.itemId = item.id)                     as chat,
       (SELECT count(seenProductId) FROM useritemseenhistory WHERE useritemseenhistory.seenProductId
           = item.id) as seenCount,
       IFNULL((SELECT isLike FROM likes where likes.itemId = item.id AND likes.userId = ${userId}),'N') as isLiked,
       item.price, item.isNegotiation
       FROM item
      JOIN user on user.id = item.userId
      JOIN location on location.id = item.locationId
      JOIN itemcategory on itemcategory.id = item.categoryId
      where item.id = ${itemId};
      `;
      const [itemDetailRows] = await connection.query(
        itemDetailQuery
      );
      const seenItemCheckQuery =`
      SELECT userId FROM useritemseenhistory WHERE userId = ${userId} AND seenProductId = ${itemId};
      `;
      const [seenItemCheckRows] = await connection.query(
        seenItemCheckQuery
      );
      if(seenItemCheckRows.length<1){
        const seenItemSetQuery = `
        INSERT INTO useritemseenhistory(userId, seenProductId) VALUES (${userId},${itemId});
      `;
      const [seenItemSetRows] = await connection.query(
        seenItemSetQuery
      );
      }
      await connection.commit(); // COMMIT
      connection.release();
      return itemDetailRows;
    }catch(err){
               await connection.rollback(); // ROLLBACK
              connection.release();
              logger.error(`get item Detail Query error\n: ${JSON.stringify(err)}`);
              return false;
    }
  }catch(err){
      logger.error(`get item Detail DB Connection error\n: ${JSON.stringify(err)}`);
      return false;
  }
}

//상품 상세 이미지 조회
async function getItemImgInfo(itemId) {
  const connection = await pool.getConnection(async (conn) => conn);
  const itemImgQuery = `
  SELECT id,photoUrl FROM itemmedia
  WHERE itemId = ${itemId};
  `;
  const [itemImgRows] = await connection.query(
    itemImgQuery
  );
  connection.release();
  return itemImgRows;
}

//판매자가 파는 다른 상품들 조회
async function getItemAnotherInfo(userId,itemId) {
  const connection = await pool.getConnection(async (conn) => conn);
  const itemAnotherQuery = `
  SELECT item.id,
  IFNULL((SELECT photoUrl FROM itemmedia where itemId = item.id LIMIT 1), '')              as img,
       item.title,
       item.status,
       item.price
  FROM item
  where item.userId = ${userId} and not item.id = ${itemId} AND status = 'ONSALE' OR status = 'RESERVATED'
  order by item.boostTime
  LIMIT 4;
  `;
  const [itemAnotherRows] = await connection.query(
    itemAnotherQuery
  );
  connection.release();
  return itemAnotherRows;
}

//추천 상품 조회
async function getItemRecommend(level,lati,logi,categoryIdx,itemId) {

  const connection = await pool.getConnection(async (conn) => conn);
  const getRecommendInfoQuery = `
  SELECT item.id,  item.status,
  IFNULL((SELECT photoUrl FROM itemmedia where itemId = item.id LIMIT 1), '') as img,
       item.title,
       item.price
  FROM item
          JOIN (SELECT *,
                        (6371 *
                        acos(cos(radians(${lati})) * cos(radians(location.latitude)) * cos(radians(location.logitude)
                            - radians(${logi})) + sin(radians(${lati})) * sin(radians(location.latitude))))
                            AS distance
                FROM location
                HAVING distance <= ${level}
                ORDER BY distance) as distance on distance.id = item.locationId
  where item.categoryId = ${categoryIdx} AND distance.distance <= item.locationDistance AND NOT item.id = ${itemId}
  order by item.boostTime desc
  LIMIT 20;
                `;
  const [getRecommendInfoRows] = await connection.query(
    getRecommendInfoQuery
  );
  connection.release();
  return getRecommendInfoRows;
}

//카테고리 목록 조회
async function getCategoryInfo() {
  const connection = await pool.getConnection(async (conn) => conn);
  const categoryInfoQuery = `
  SELECT id,categoryName FROM itemcategory;
  `;
  const [categoryInfoRows] = await connection.query(
    categoryInfoQuery
  );
  connection.release();
  return categoryInfoRows;
}


//상품 등록
async function insertItemInfo(userId,title,categoryId,locationId,price,nego,contents,distance,img) {
  try{
    const connection = await pool.getConnection(async (conn) => conn);
    try{
      await connection.beginTransaction(); // START TRANSACTION
      const itemInsertQuery = `
      INSERT INTO item(userId, title, categoryId, locationId, price, isNegotiation, contents, locationDistance)
       VALUES (${userId},'${title}',${categoryId},${locationId},${price},'${nego}','${contents}',${distance});
      `;
      const [itemInsertRows] = await connection.query(
        itemInsertQuery
      );
      const checkItemIdQuery =`
      SELECT LAST_INSERT_ID() as id;
      `;
      
      const [checkItemIdRows] = await connection.query(
        checkItemIdQuery
      );
      if(!(img == 0)){
        for(let i=0; i < img.length; i++){
          const insertItemImgQuery = `
          INSERT INTO itemmedia(itemId, photoUrl) VALUES (${checkItemIdRows[0].id},'${img[i]}');
      `;
      const [insertItemImgRows] = await connection.query(
        insertItemImgQuery
      );
        }
      }
      await connection.commit(); // COMMIT
      connection.release();
      return itemInsertRows;
    }catch(err){
               await connection.rollback(); // ROLLBACK
              connection.release();
              logger.error(`insert item Query error\n: ${JSON.stringify(err)}`);
              return false;
    }
  }catch(err){
      logger.error(`insert item DB Connection error\n: ${JSON.stringify(err)}`);
      return false;
  }
}

//상품 삭제
async function deleteItemInfo(itemId) {
  try{
    const connection = await pool.getConnection(async (conn) => conn);
    try{
      await connection.beginTransaction(); // START TRANSACTION
      const itemDeleteQuery = `
      DELETE FROM item WHERE id = ${itemId};
      `;
      const [itemDeleteRows] = await connection.query(
        itemDeleteQuery
      );
      const deleteItemImgQuery =`
      DELETE FROM itemmedia WHERE itemId = ${itemId};
      `;
      
      const [deleteItemImgRows] = await connection.query(
        deleteItemImgQuery
      );
      await connection.commit(); // COMMIT
      connection.release();
      return itemDeleteRows;
    }catch(err){
               await connection.rollback(); // ROLLBACK
              connection.release();
              logger.error(`delete item Query error\n: ${JSON.stringify(err)}`);
              return false;
    }
  }catch(err){
      logger.error(`delete item DB Connection error\n: ${JSON.stringify(err)}`);
      return false;
  }
}

//상품 수정
async function modifyItemInfo(userId,title,categoryId,locationId,price,nego,contents,distance,img,itemId) {
  try{
    const connection = await pool.getConnection(async (conn) => conn);
    try{
      await connection.beginTransaction(); // START TRANSACTION
      const itemModifyQuery = `
      UPDATE item SET userId = ${userId}, title = '${title}' , categoryId = ${categoryId} , locationId = ${locationId} , 
      price = ${price}, isNegotiation = '${nego}' , contents = '${contents}', locationDistance = ${distance}
      WHERE id = ${itemId};
      `;
      const [itemModifyRows] = await connection.query(
        itemModifyQuery
      );
      const deleteItemImgQuery =`
        DELETE FROM itemmedia WHERE itemId = ${itemId};
      `;
      
      const [deleteItemImgRows] = await connection.query(
        deleteItemImgQuery
      );
      if(!(img == 0)){
        for(let i=0; i < img.length; i++){
          const insertItemImgQuery = `
          INSERT INTO itemmedia(itemId, photoUrl) VALUES (${itemId},'${img[i]}');
      `;
      const [insertItemImgRows] = await connection.query(
        insertItemImgQuery
      );
        }
      }
      
      await connection.commit(); // COMMIT
      connection.release();
      return itemModifyRows;
    }catch(err){
               await connection.rollback(); // ROLLBACK
              connection.release();
              logger.error(`modify item Query error\n: ${JSON.stringify(err)}`);
              return false;
    }
  }catch(err){
      logger.error(`modify item DB Connection error\n: ${JSON.stringify(err)}`);
      return false;
  }
}

module.exports = {
  getLocation,
  checkCategory,
  getBoardMain,
  getAllBoard,
  getOnSaleBoard,
  getCompletionBoard,
  getHideBoard,
  checkItemUser,
  changeItemInfo,
  boostItemInfo,
  getItemDetailInfo,
  getItemImgInfo,
  getItemAnotherInfo,
  getItemRecommend,
  getCategoryInfo,
  insertItemInfo,
  deleteItemInfo,
  modifyItemInfo
};
