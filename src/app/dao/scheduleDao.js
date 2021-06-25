const { pool } = require("../../../config/database");

//인기 검색어 갱신
async function updateKeyword() {
  try{
    const connection = await pool.getConnection(async (conn) => conn);
    try{
      await connection.beginTransaction(); // START TRANSACTION
      const deleteKeywordQuery = `
      DELETE FROM popularkeyword where TIMESTAMPDIFF(day,NOW(),createdAt)=0;
      `;
      const [deleteKeywordRows] = await connection.query(
        deleteKeywordQuery
      );
      const selectKeywordQuery =`
      SELECT searchString,count(searchString) FROM usersearchhistory where timestampdiff(hour,createdAt,now())<=1 group by searchString
      order by count(searchString) desc LIMIT 10;
      `;
      
      const [selectKeywordRows] = await connection.query(
        selectKeywordQuery
      );
      if(selectKeywordRows.length>0){
        for(var i=0; i<selectKeywordRows.length; i++){
          const insertKeywordQuery = `
          INSERT INTO popularkeyword(keyword) VALUES ('${selectKeywordRows[i].searchString}');
      `;
      const [insertKeywordRows] = await connection.query(
        insertKeywordQuery
      );
        }
      }
      await connection.commit(); // COMMIT
      connection.release();
      return insertKeywordRows;
    }catch(err){
               await connection.rollback(); // ROLLBACK
              connection.release();
              logger.error(`insert popular keyword Query error\n: ${JSON.stringify(err)}`);
              return false;
    }
  }catch(err){
      logger.error(`insert popular keyword DB Connection error\n: ${JSON.stringify(err)}`);
      return false;
  }
}

module.exports = {
  updateKeyword
};
