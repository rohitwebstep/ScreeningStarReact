const { pool, startConnection, connectionRelease } = require("../../config/db");

const AuthorizedDetail = {
  create: (title, designation, phone, email, admin_id, callback) => {
    // Step 1: Check if a billing escalation with the same title already exists
    const checkAuthorizedDetailSql = `
      SELECT * FROM \`billing_escalations\` WHERE \`title\` = ?
    `;

    startConnection((err, connection) => {
      if (err) {
        return callback(err, null);
      }

      connection.query(
        checkAuthorizedDetailSql,
        [title],
        (checkErr, authorizedDetailResults) => {
          if (checkErr) {
            console.error("Error checking billing escalation:", checkErr);
            connectionRelease(connection); // Release connection on error
            return callback(checkErr, null);
          }

          // Step 2: If a billing escalation with the same title exists, return an error
          if (authorizedDetailResults.length > 0) {
            const error = new Error(
              "Billing SPOC with the same name already exists"
            );
            console.error(error.message);
            connectionRelease(connection); // Release connection before returning error
            return callback(error, null);
          }

          // Step 3: Insert the new billing escalation
          const insertAuthorizedDetailSql = `
          INSERT INTO \`billing_escalations\` (\`title\`, \`designation\`, \`phone\`, \`email\`, \`admin_id\`)
          VALUES (?, ?, ?, ?, ?)
        `;

          connection.query(
            insertAuthorizedDetailSql,
            [title, designation, phone, email, admin_id],
            (insertErr, results) => {
              connectionRelease(connection); // Release the connection

              if (insertErr) {
                console.error("Database query error: 46", insertErr);
                return callback(insertErr, null);
              }
              callback(null, results);
            }
          );
        }
      );
    });
  },

  checkEmailExists: (email, callback) => {
    const sql = `SELECT 1 FROM \`billing_escalations\` WHERE email = ? LIMIT 1`;

    startConnection((err, connection) => {
      if (err) {
        return callback(err, null);
      }

      connection.query(sql, [email], (queryErr, results) => {
        connectionRelease(connection); // Release the connection

        if (queryErr) {
          console.error("Database query error: 47", queryErr);
          return callback(queryErr, null);
        }

        // Return true if the email exists, else false
        const emailExists = results.length > 0;
        callback(null, emailExists);
      });
    });
  },

  list: (callback) => {
    const sql = `SELECT * FROM \`billing_escalations\``;

    startConnection((err, connection) => {
      if (err) {
        return callback(err, null);
      }

      connection.query(sql, (queryErr, results) => {
        connectionRelease(connection); // Release the connection

        if (queryErr) {
          console.error("Database query error: 47", queryErr);
          return callback(queryErr, null);
        }
        callback(null, results);
      });
    });
  },

  getAuthorizedDetailById: (id, callback) => {
    const sql = `SELECT * FROM \`billing_escalations\` WHERE \`id\` = ?`;

    startConnection((err, connection) => {
      if (err) {
        return callback(err, null);
      }

      connection.query(sql, [id], (queryErr, results) => {
        connectionRelease(connection); // Release the connection

        if (queryErr) {
          console.error("Database query error: 49", queryErr);
          return callback(queryErr, null);
        }
        callback(null, results[0]);
      });
    });
  },

  update: (id, title, designation, phone, email, callback) => {
    const sql = `
      UPDATE \`billing_escalations\`
      SET \`title\` = ?, \`designation\` = ?, \`phone\` = ?, \`email\` = ?
      WHERE \`id\` = ?
    `;

    startConnection((err, connection) => {
      if (err) {
        return callback(err, null);
      }

      connection.query(sql, [title, designation, phone, email, id], (queryErr, results) => {
        connectionRelease(connection); // Release the connection

        if (queryErr) {
          console.error(" 51", queryErr);
          return callback(queryErr, null);
        }
        callback(null, results);
      });
    });
  },

  delete: (id, callback) => {
    const sql = `
      DELETE FROM \`billing_escalations\`
      WHERE \`id\` = ?
    `;

    startConnection((err, connection) => {
      if (err) {
        return callback(err, null);
      }

      connection.query(sql, [id], (queryErr, results) => {
        connectionRelease(connection); // Release the connection

        if (queryErr) {
          console.error("Database query error: 51", queryErr);
          return callback(queryErr, null);
        }
        callback(null, results);
      });
    });
  },
};

module.exports = AuthorizedDetail;
