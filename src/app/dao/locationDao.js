const { pool } = require("../../../config/database");

// 전체적인 엔터키, try-catch 문 추가


//내위치로 동네 조회
async function getLocationNear(lati,logi) {
  const connection = await pool.getConnection(async (conn) => conn);
  const locationInfoQuery = `
  SELECT id, name,
                      (6371 *
                       acos(cos(radians(${lati})) * cos(radians(location.latitude)) * cos(radians(Location.logitude)
                           - radians(${logi})) + sin(radians(${lati})) * sin(radians(location.latitude))))
                          AS distance
               FROM location
               HAVING distance <= 2
               ORDER BY distance;
  `;
  const [locationInfoRows] = await connection.query(
    locationInfoQuery
  );
  connection.release();
  return locationInfoRows;
}
// 카테고리 예외처리
async function checkQuery(lati,logi) {
  
    if(isNaN(lati)||isNaN(logi)){
      return false;
    }
  return true;
}

// 동네 검색

async function getLocationSearch(keyword) {
  const connection = await pool.getConnection(async (conn) => conn);
  const locationSearchQuery = `
  SELECT id,name FROM location WHERE name LIKE concat('%','${keyword}','%');
  `;
  const [locationSearchRows] = await connection.query(
    locationSearchQuery
  );
  connection.release();
  return locationSearchRows;
}

// 내 동네 설정

async function setLocationInfo(userId,locationId) {
  try{
  const connection = await pool.getConnection(async (conn) => conn);
  try{
    await connection.beginTransaction(); // START TRANSACTION
    const locationSetQuery = `
    INSERT INTO userlocation(userId, locationId) VALUES (${userId},${locationId});
    `;
    const [locationSetRows] = await connection.query(
      locationSetQuery
    );
    const locationCheckQuery = `
    UPDATE userlocation SET userlocation.isChecked = 'N' where userId = ${userId} AND NOT locationId = ${locationId};
    `;
    const [locationCheckRows] = await connection.query(
      locationCheckQuery
    );
    await connection.commit(); // COMMIT
    connection.release();
    return locationSetRows;
  }catch(err){
             await connection.rollback(); // ROLLBACK
            connection.release();
            logger.error(`example transaction Query error\n: ${JSON.stringify(err)}`);
            return false;
  }
}catch(err){
    logger.error(`example transaction DB Connection error\n: ${JSON.stringify(err)}`);
    return false;
}
}

// 내 동네 숫자 체크

async function checkCount(userId) {
  const connection = await pool.getConnection(async (conn) => conn);
  const checkCountQuery = `
  SELECT count(userId) as counts FROM userlocation where userId = ${userId};
  `;
  const [checkCountRows] = await connection.query(
    checkCountQuery
  );
  connection.release();
  return checkCountRows;
}

async function checkLocation(userId,locationId) {
  const connection = await pool.getConnection(async (conn) => conn);
  const checkLocationQuery = `
  SELECT locationId FROM userlocation where userId = ${userId} AND locationId = ${locationId};
  `;
  const [checkLocationRows] = await connection.query(
    checkLocationQuery
  );
  connection.release();
  return checkLocationRows;
}

async function checkLocationCount(userId) {
  const connection = await pool.getConnection(async (conn) => conn);
  const checkLocationQuery = `
  SELECT locationId FROM userlocation where userId = ${userId};
  `;
  const [checkLocationRows] = await connection.query(
    checkLocationQuery
  );
  connection.release();
  return checkLocationRows;
}

// 내 동네 설정 화면 조회
async function getLocationMy(userId) {
  const connection = await pool.getConnection(async (conn) => conn);
  const myLocationQuery = `
  SELECT userLocation.locationId,substring_index(location.name,',',1) as name, userlocation.isChecked FROM userlocation
  JOIN location ON location.id = userlocation.locationId where userlocation.userId = ${userId};
  `;
  const [myLocationRows] = await connection.query(
    myLocationQuery
  );
  connection.release();
  return myLocationRows;
}

// 내 동네 설정 변경
async function setLocationMy(userId,locationId) {
  try{
  const connection = await pool.getConnection(async (conn) => conn);
  try{
    await connection.beginTransaction(); // START TRANSACTION
    const locationSetQuery = `
    UPDATE userlocation SET userlocation.isChecked = 'Y' WHERE userId = ${userId} AND locationId = ${locationId};
    `;
    const [locationSetRows] = await connection.query(
      locationSetQuery
    );
    const locationCheckQuery = `
    UPDATE userlocation SET userlocation.isChecked = 'N' where userId = ${userId} AND NOT locationId = ${locationId};
    `;
    const [locationCheckRows] = await connection.query(
      locationCheckQuery
    );
    await connection.commit(); // COMMIT
    connection.release();
    return locationSetRows;
  }catch(err){
             await connection.rollback(); // ROLLBACK
            connection.release();
            logger.error(`set My Location Query error\n: ${JSON.stringify(err)}`);
            return false;
  }
}catch(err){
    logger.error(`set My Location DB Connection error\n: ${JSON.stringify(err)}`);
    return false;
}
}

// 내 동네 설정 삭제
async function deleteLocationMy(userId,locationId) {
  try{
  const connection = await pool.getConnection(async (conn) => conn);
  try{
    await connection.beginTransaction(); // START TRANSACTION
    const locationDeleteQuery = `
    UPDATE userlocation SET userlocation.isChecked = 'Y' WHERE userId = ${userId} AND NOT locationId = ${locationId};
    `;
    const [locationDeleteRows] = await connection.query(
      locationDeleteQuery
    );
    const deleteCheckQuery = `
    DELETE FROM userlocation WHERE userId = ${userId} AND locationId = ${locationId};
    `;
    const [deleteCheckRows] = await connection.query(
      deleteCheckQuery
    );
    await connection.commit(); // COMMIT
    connection.release();
    return locationDeleteRows;
  }catch(err){
             await connection.rollback(); // ROLLBACK
            connection.release();
            logger.error(`delete My Location Query error\n: ${JSON.stringify(err)}`);
            return false;
  }
}catch(err){
    logger.error(`delete My Location DB Connection error\n: ${JSON.stringify(err)}`);
    return false;
}
}

//위치 정보 조회(쿼리용)
async function getLocation(userInfo) {
  const connection = await pool.getConnection(async (conn) => conn);
  const locationInfoQuery = `
  SELECT userlocation.locationId,userlocation.level, location.latitude, location.logitude FROM location
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

// 내 주변 동네 범위 조회
async function getNeighborhoodInfo(level,lati,logi,userId) {
  const connection = await pool.getConnection(async (conn) => conn);
  const neighborhoodInfoQuery = `
  SELECT id,level,concat(substring_index(location.name,',',1),'과 근처 동네',count(ditan.name),'개')  as counts FROM userlocation
  join location on location.id = userlocation.locationId
  join (SELECT name,
                      (6371 *
                       acos(cos(radians(${lati})) * cos(radians(lo.latitude)) * cos(radians(lo.logitude)
                           - radians(${logi})) + sin(radians(${lati})) * sin(radians(lo.latitude))))
                          AS distance
               FROM location as lo HAVING distance <= ${level}
               ORDER BY distance) as ditan
    where userlocation.userId = ${userId} AND userlocation.isChecked = 'Y';
  `;
  const [neighborhoodInfoRows] = await connection.query(
    neighborhoodInfoQuery
  );
  connection.release();
  return neighborhoodInfoRows;
}

// 내 주변 동네 상세 조회
async function getNeighborhoodDetailInfo(level,lati,logi,userId) {
  const connection = await pool.getConnection(async (conn) => conn);
  const neighborhoodDetailQuery = `
  SELECT substring_index(ditan.name, ',', 1) as name FROM userlocation
  join location on location.id = userlocation.locationId
  join (SELECT name,
                      (6371 *
                       acos(cos(radians(${lati})) * cos(radians(lo.latitude)) * cos(radians(lo.logitude)
                           - radians(${logi})) + sin(radians(${lati})) * sin(radians(lo.latitude))))
                          AS distance
               FROM location as lo HAVING distance <= ${level}
               ORDER BY distance) as ditan
    where userlocation.userId = ${userId} AND userlocation.isChecked = 'Y';
  `;
  const [neighborhoodDetailRows] = await connection.query(
    neighborhoodDetailQuery
  );
  connection.release();
  return neighborhoodDetailRows;
}

// 내 주변동네 범위 변경
async function setNeighborhoodInfo(level,userId) {
  const connection = await pool.getConnection(async (conn) => conn);
  const neighborhoodSetQuery = `
  UPDATE userlocation SET level = ${level} WHERE userId = ${userId} AND userlocation.isChecked = 'Y';
  `;
  const [neighborhoodSetRows] = await connection.query(
    neighborhoodSetQuery
  );
  connection.release();
  return neighborhoodSetRows;
}

// 위치인증가능여부조회
async function getCertLocation(lati,logi,locationId) {
  const connection = await pool.getConnection(async (conn) => conn);
  const certSetQuery = `
  SELECT id,substring_index(lo.name,',',1) as name,
                      (6371 *
                       acos(cos(radians(${lati})) * cos(radians(lo.latitude)) * cos(radians(lo.logitude)
                           - radians(${logi})) + sin(radians(${lati})) * sin(radians(lo.latitude))))
                          AS distance
               FROM location as lo
        where lo.id = ${locationId}
            HAVING distance <= 2
               ORDER BY distance;
  `;
  const [certSetRows] = await connection.query(
    certSetQuery
  );
  connection.release();
  return certSetRows;
}

// 동네 인증하기
async function setCertLocation(userId,locationId) {
  try{
  const connection = await pool.getConnection(async (conn) => conn);
  try{
    await connection.beginTransaction(); // START TRANSACTION
    const locationCertQuery = `
    UPDATE userlocation SET isCertified = 'Y' WHERE userId = ${userId} AND locationId = ${locationId};
    `;
    const [locationCertRows] = await connection.query(
      locationCertQuery
    );
    const locationInfoQuery = `
    SELECT substring_index(location.name,',',1) as name FROM location
  Join userLocation on userLocation.locationId = location.id
  WHERE userLocation.userId = ${userId} AND location.id = ${locationId};
    `;
    const [locationInfoRows] = await connection.query(
      locationInfoQuery
    );
    await connection.commit(); // COMMIT
    connection.release();
    return locationInfoRows;
  }catch(err){
             await connection.rollback(); // ROLLBACK
            connection.release();
            logger.error(`certification Location Query error\n: ${JSON.stringify(err)}`);
            return false;
  }
}catch(err){
    logger.error(`certification Location DB Connection error\n: ${JSON.stringify(err)}`);
    return false;
}
}

module.exports = {
  getLocationNear,
  checkQuery,
  getLocationSearch,
  setLocationInfo,
  checkCount,
  checkLocation,
  getLocationMy,
  setLocationMy,
  deleteLocationMy,
  checkLocationCount,
  getLocation,
  getNeighborhoodInfo,
  getNeighborhoodDetailInfo,
  setNeighborhoodInfo,
  getCertLocation,
  setCertLocation
};
