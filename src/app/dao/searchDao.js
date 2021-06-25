const { pool } = require("../../../config/database");



//위치 정보 조회(검색용)
async function getLocation(userInfo) {
  const connection = await pool.getConnection(async (conn) => conn);
  const locationInfoQuery = `
  SELECT userlocation.level, location.latitude, location.logitude FROM location
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
  for(var i=0; i<category.length; i++){
    if(isNaN(category[i])){
      return false;
    }
  }
  return true;
}

//상품 검색 조회
async function getSearchItem(lati,logi,keyword,userId) {
  try{
    const connection = await pool.getConnection(async (conn) => conn);
    try{
      await connection.beginTransaction(); // START TRANSACTION
      const getSearchItemInfoQuery = `
  SELECT item.id, item.categoryId,
       IFNULL((SELECT photoUrl FROM itemmedia where itemId = item.id LIMIT 1), '') as img,
       item.title,
       substring_index((SELECT name FROM location WHERE location.id = item.locationId) , ',', 1)          as location,
       if(item.isBoosted = 'N', (case
                                     when timestampdiff(minute, item.createdAt, now()) < 60
                                         then concat(timestampdiff(minute, item.createdAt, now()), '분 전')
                                     when timestampdiff(hour, item.createdAt, now()) < 24
                                         then concat(timestampdiff(hour, item.createdAt, now()), '시간 전')
                                     else concat(timestampdiff(day, item.createdAt, now()), '일 전')
           END),concat('끌올 ',
          (case
               when timestampdiff(minute, item.boostTime, now()) < 60
                   then concat(timestampdiff(minute, item.boostTime, now()), '분 전')
               when timestampdiff(hour, item.boostTime, now()) < 24
                   then concat(timestampdiff(hour, item.boostTime, now()), '시간 전')
               else concat(timestampdiff(day, item.boostTime, now()), '일 전')
              END)))                                                                as time,
       item.price,
       item.status,
       (SELECT count(itemId) FROM likes WHERE likes.itemId = item.id)              as likes,
       (SELECT count(itemId) FROM chatroom WHERE chatroom.itemId = item.id) as chat
  FROM item
          JOIN (SELECT *,
                        (6371 *
                        acos(cos(radians(${lati})) * cos(radians(location.latitude)) * cos(radians(Location.logitude)
                            - radians(${logi})) + sin(radians(${lati})) * sin(radians(Location.latitude))))
                            AS distance
                FROM location
                HAVING distance <= 10
                ORDER BY distance) as distance on distance.id = item.locationId
                where replace(item.title,' ','') LIKE concat('%',replace('${keyword}',' ',''),'%')
  order by item.boostTime desc;
                `;
  const [getSearchItemRows] = await connection.query(
    getSearchItemInfoQuery
  );
      const insertSearchHistoryQuery =`
        INSERT INTO usersearchhistory(userId, searchString) VALUES (${userId},'${keyword}');
      `;
      
      const [insertSearchHistoryRows] = await connection.query(
        insertSearchHistoryQuery
      );
      
      await connection.commit(); // COMMIT
      connection.release();
      return getSearchItemRows;
    }catch(err){
               await connection.rollback(); // ROLLBACK
              connection.release();
              logger.error(`search item Query error\n: ${JSON.stringify(err)}`);
              return false;
    }
  }catch(err){
      logger.error(`search item DB Connection error\n: ${JSON.stringify(err)}`);
      return false;
  }
}

//상품 필터링 검색
async function filterSearchItem(lati,logi,keyword,level,categoryId,minPrice,maxPrice) {

  const connection = await pool.getConnection(async (conn) => conn);
  const fliterSearchItemInfoQuery = `
  SELECT item.id, item.categoryId,
       IFNULL((SELECT photoUrl FROM itemmedia where itemId = item.id LIMIT 1), '') as img,
       item.title,
       substring_index((SELECT name FROM location WHERE location.id = item.locationId) , ',', 1)          as location,
       if(item.isBoosted = 'N', (case
                                     when timestampdiff(minute, item.createdAt, now()) < 60
                                         then concat(timestampdiff(minute, item.createdAt, now()), '분 전')
                                     when timestampdiff(hour, item.createdAt, now()) < 24
                                         then concat(timestampdiff(hour, item.createdAt, now()), '시간 전')
                                     else concat(timestampdiff(day, item.createdAt, now()), '일 전')
           END),concat('끌올 ',
          (case
               when timestampdiff(minute, item.boostTime, now()) < 60
                   then concat(timestampdiff(minute, item.boostTime, now()), '분 전')
               when timestampdiff(hour, item.boostTime, now()) < 24
                   then concat(timestampdiff(hour, item.boostTime, now()), '시간 전')
               else concat(timestampdiff(day, item.boostTime, now()), '일 전')
              END)))                                                                as time,
       item.price,
       item.status,
       (SELECT count(itemId) FROM likes WHERE likes.itemId = item.id)              as likes,
       (SELECT count(itemId) FROM chatroom WHERE chatroom.itemId = item.id) as chat
  FROM item
          JOIN (SELECT *,
                        (6371 *
                        acos(cos(radians(${lati})) * cos(radians(location.latitude)) * cos(radians(Location.logitude)
                            - radians(${logi})) + sin(radians(${lati})) * sin(radians(Location.latitude))))
                            AS distance
                FROM location
                HAVING distance <= ${level}
                ORDER BY distance) as distance on distance.id = item.locationId
  where replace(item.title,' ','') LIKE concat('%',replace('${keyword}',' ',''),'%') AND item.categoryId IN (${categoryId}) AND item.price < ${maxPrice} 
  AND item.price > ${minPrice}
  order by item.boostTime desc;
                `;
  const [fliterSearchItemRows] = await connection.query(
    fliterSearchItemInfoQuery
  );
  connection.release();
  return fliterSearchItemRows;
}

async function insertNum(num) {

  const nums = num;
  return nums;
}


//유저 검색
async function getSearchUser(lati,logi,keyword) {

  const connection = await pool.getConnection(async (conn) => conn);
  const userSearchInfoQuery = `
  SELECT user.id,
       user.profilePhotoUrl,
       user.nickname,
       substring_index((SELECT name FROM location WHERE location.id = userlocation.locationId), ',', 1) as location
  FROM user
          JOIN userlocation on userlocation.userId = user.id
          JOIN location on location.id = userlocation.locationId
          JOIN (SELECT *,
                        (6371 *
                        acos(cos(radians(${lati})) * cos(radians(location.latitude)) * cos(radians(Location.logitude)
                            - radians(${logi})) + sin(radians(${lati})) * sin(radians(Location.latitude))))
                            AS distance
                FROM location
                HAVING distance <= 10
                ORDER BY distance) as distance on distance.id = userlocation.locationId
  WHERE userlocation.isChecked = 'Y'
    and replace(user.nickname, ' ', '') LIKE concat('%', replace('${keyword}', ' ', ''), '%');
                `;
  const [userSearchRows] = await connection.query(
    userSearchInfoQuery
  );
  connection.release();
  return userSearchRows;
}

//유저 검색(인덱스)
async function getSearchUserIndex(lati,logi,keyword) {
  const connection = await pool.getConnection(async (conn) => conn);
  const userSearchInfoQuery = `
  SELECT user.id,
       user.profilePhotoUrl,
       user.nickname,
       substring_index((SELECT name FROM location WHERE location.id = userlocation.locationId), ',', 1) as location
  FROM user
          JOIN userlocation on userlocation.userId = user.id
          JOIN location on location.id = userlocation.locationId
          JOIN (SELECT *,
                        (6371 *
                        acos(cos(radians(${lati})) * cos(radians(location.latitude)) * cos(radians(Location.logitude)
                            - radians(${logi})) + sin(radians(${lati})) * sin(radians(Location.latitude))))
                            AS distance
                FROM location
                HAVING distance <= 10
                ORDER BY distance) as distance on distance.id = userlocation.locationId
  WHERE userlocation.isChecked = 'Y'
    and user.id = ${keyword};
                `;
  const [userSearchRows] = await connection.query(
    userSearchInfoQuery
  );
  connection.release();
  return userSearchRows;
}

//인기 검색어 조회
async function getPopularKeyword() {
  const connection = await pool.getConnection(async (conn) => conn);
  const popularKeywordQuery = `
  SELECT keyword FROM popularkeyword;
                `;
  const [popularKeywordRows] = await connection.query(
    popularKeywordQuery
  );
  connection.release();
  return popularKeywordRows;
}

module.exports = {
  getLocation,
  checkCategory,
  getSearchItem,
  filterSearchItem,
  insertNum,
  getSearchUser,
  getSearchUserIndex,
  getPopularKeyword
};
