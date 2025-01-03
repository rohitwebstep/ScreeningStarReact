const { pool, startConnection, connectionRelease } = require("../../config/db");

const Admin = {
  list: (callback) => {
    const sql = `SELECT \`id\`, \`emp_id\`, \`name\`, \`profile_picture\`, \`email\`, \`mobile\`, \`date_of_joining\`, \`designation\`, \`role\`, \`status\` FROM \`admins\``;

    startConnection((err, connection) => {
      if (err) {
        return callback(err, null);
      }

      connection.query(sql, (queryErr, results) => {
        connectionRelease(connection); // Release the connection

        if (queryErr) {
          console.error("Database query error: 5", queryErr);
          return callback(queryErr, null);
        }
        callback(null, results);
      });
    });
  },

  create: (data, callback) => {
    const {
      name,
      email,
      emp_id,
      date_of_joining,
      role,
      password,
      designation,
    } = data;
    const mobile = parseInt(data.mobile, 10);
    // SQL query to check if any field already exists in the admins table
    const checkExistingQuery = `
      SELECT * FROM \`admins\` WHERE \`email\` = ? OR \`mobile\` = ? OR \`emp_id\` = ?
    `;

    startConnection((err, connection) => {
      if (err) {
        return callback(err, null);
      }

      // Check if any field already exists in the admins table
      connection.query(
        checkExistingQuery,
        [email, mobile, emp_id],
        (checkErr, results) => {
          if (checkErr) {
            connectionRelease(connection); // Release connection on error
            return callback(checkErr, null);
          }
          // If results are found, check which fields are already in use
          if (results.length > 0) {
            const fieldMapping = {
              email: "email",
              mobile: "mobile",
              emp_id: "Employee ID",
            };

            const usedFields = [];

            // Loop through each result
            for (const existingAdmin of results) {
              console.log(`existingAdmin - `, existingAdmin);
              for (const [key, label] of Object.entries(fieldMapping)) {
                console.log(`key - `, key);
                console.log(`label - `, label);
                console.log(`existingAdmin[key] - `, existingAdmin[key]);

                if (existingAdmin[key] === eval(key)) {
                  usedFields.push(label);
                }
              }
            }

            if (usedFields.length > 0) {
              connectionRelease(connection); // Release connection if duplicates found
              return callback(
                `Another admin is registered with the following ${[
                  ...new Set(usedFields),
                ].join(" and ")}.`,
                null
              );
            }
          }

          // If no duplicates are found, proceed with inserting the new admin
          const sql = `
            INSERT INTO \`admins\` (\`name\`, \`emp_id\`, \`mobile\`, \`email\`, \`date_of_joining\`, \`role\`, \`status\`, \`password\`, \`designation\`) 
            VALUES (?, ?, ?, ?, ?, ?, ?, md5(?), ?)
          `;
          connection.query(
            sql,
            [
              name,
              emp_id,
              mobile,
              email,
              date_of_joining,
              role,
              "1",
              password,
              designation,
            ],
            (queryErr, results) => {
              connectionRelease(connection); // Release the connection

              if (queryErr) {
                console.error("Database query error: 6", queryErr);
                return callback(queryErr, null);
              }
              callback(null, results); // Successfully inserted the admin
            }
          );
        }
      );
    });
  },

  update: (data, callback) => {
    const {
      id,
      name,
      email,
      emp_id,
      date_of_joining,
      role,
      status,
      designation,
    } = data;

    const mobile = parseInt(data.mobile, 10);

    // SQL query to check if any field already exists in the admins table
    const checkExistingQuery = `
      SELECT * FROM \`admins\` 
      WHERE (\`email\` = ? OR \`mobile\` = ? OR \`emp_id\` = ?) AND \`id\` != ?
    `;

    startConnection((err, connection) => {
      if (err) {
        return callback(err, null);
      }

      // Check if any field already exists in the admins table
      connection.query(
        checkExistingQuery,
        [email, mobile, emp_id, id],
        (checkErr, results) => {
          if (checkErr) {
            connectionRelease(connection); // Release connection on error
            return callback(checkErr, null);
          }

          // If results are found, check which fields are already in use
          if (results.length > 0) {
            const fieldMapping = {
              email: "email",
              mobile: "mobile",
              emp_id: "Employee ID",
            };

            const usedFields = [];

            // Loop through each result
            for (const existingAdmin of results) {
              console.log(`existingAdmin - `, existingAdmin);
              for (const [key, label] of Object.entries(fieldMapping)) {
                console.log(`key - `, key);
                console.log(`label - `, label);
                console.log(`existingAdmin[key] - `, existingAdmin[key]);

                if (existingAdmin[key] === eval(key)) {
                  usedFields.push(label);
                }
              }
            }

            if (usedFields.length > 0) {
              connectionRelease(connection); // Release connection if duplicates found
              return callback(
                `Another admin is registered with the following ${[
                  ...new Set(usedFields),
                ].join(" and ")}.`,
                null
              );
            }
          }

          // If no duplicates are found, proceed with updating the admin record
          const sql = `
            UPDATE \`admins\` 
            SET 
              \`name\` = ?, 
              \`emp_id\` = ?, 
              \`mobile\` = ?, 
              \`email\` = ?, 
              \`date_of_joining\` = ?, 
              \`role\` = ?, 
              \`status\` = ?, 
              \`designation\` = ?
            WHERE \`id\` = ?
          `;

          connection.query(
            sql,
            [
              name,
              emp_id,
              mobile,
              email,
              date_of_joining,
              role,
              status,
              designation,
              id,
            ],
            (queryErr, results) => {
              connectionRelease(connection); // Release the connection

              if (queryErr) {
                console.error("Database query error: 7", queryErr);
                return callback(queryErr, null);
              }
              callback(null, results); // Successfully updated the admin
            }
          );
        }
      );
    });
  },

  delete: (id, callback) => {
    const sql = `
      DELETE FROM \`admins\`
      WHERE \`id\` = ?
    `;

    startConnection((err, connection) => {
      if (err) {
        return callback(err, null);
      }

      connection.query(sql, [id], (queryErr, results) => {
        connectionRelease(connection); // Release the connection

        if (queryErr) {
          console.error("Database query error: 8", queryErr);
          return callback(queryErr, null);
        }
        callback(null, results);
      });
    });
  },

  upload: (id, savedImagePaths, callback) => {
    startConnection((err, connection) => {
      if (err) {
        return callback(
          { message: "Failed to connect to the database", error: err },
          null
        );
      }
      const sqlUpdateCustomer = `
      UPDATE admins 
      SET profile_picture = ?
      WHERE id = ?
    `;
      const joinedPaths = savedImagePaths.join(", ");
      // Prepare the parameters for the query
      const queryParams = [joinedPaths, id];

      connection.query(sqlUpdateCustomer, queryParams, (err, results) => {
        connectionRelease(connection); // Ensure the connection is released

        if (err) {
          // Return error details and the final query with parameters
          return callback(false, {
            error: "Database error occurred.",
            details: err, // Include error details for debugging
            query: sqlUpdateCustomer,
            params: queryParams, // Return the parameters used in the query
          });
        }

        // Check if any rows were affected by the update
        if (results.affectedRows > 0) {
          return callback(true, results); // Success with results
        } else {
          // No rows updated, return a specific message along with the query details
          return callback(false, {
            error: "No rows updated. Please check the Admin ID.",
            details: results,
            query: sqlUpdateCustomer,
            params: queryParams, // Return the parameters used in the query
          });
        }
      });
    });
  },

  findByEmailOrMobile: (username, callback) => {
    const sql = `
      SELECT \`id\`, \`emp_id\`, \`name\`, \`profile_picture\`, \`email\`, \`mobile\`, \`role\`, \`designation\`, \`status\`, \`login_token\`, \`token_expiry\`, \`date_of_joining\`
      FROM \`admins\`
      WHERE \`email\` = ? OR \`mobile\` = ?
    `;

    startConnection((err, connection) => {
      if (err) {
        return callback(err, null);
      }

      connection.query(sql, [username, username], (queryErr, results) => {
        if (queryErr) {
          console.error("Database query error: 9", queryErr);
          connection.release(); // Ensure connection is released after the query fails
          return callback(
            { message: "Database query error", error: queryErr },
            null
          );
        }

        connection.release(); // Ensure connection is released after the query succeeds

        if (results.length === 0) {
          return callback(
            { message: "No admin found with the provided email or mobile" },
            null
          );
        }

        callback(null, results);
      });
    });
  },

  findByEmailOrMobileAllInfo: (username, callback) => {
    const sql = `
      SELECT *
      FROM \`admins\`
      WHERE \`email\` = ? OR \`mobile\` = ?
    `;

    startConnection((err, connection) => {
      if (err) {
        return callback(err, null);
      }

      connection.query(sql, [username, username], (queryErr, results) => {
        connectionRelease(connection); // Release the connection

        if (queryErr) {
          console.error("Database query error: 11", queryErr);
          return callback(
            { message: "Database query error", error: queryErr },
            null
          );
        }

        if (results.length === 0) {
          return callback(
            { message: "No admin found with the provided email or mobile" },
            null
          );
        }

        callback(null, results);
      });
    });
  },

  validatePassword: (username, password, callback) => {
    const sql = `
      SELECT \`id\`, \`emp_id\`, \`name\`, \`profile_picture\`, \`email\`, \`mobile\`, \`status\`
      FROM \`admins\`
      WHERE (\`email\` = ? OR \`mobile\` = ?)
      AND \`password\` = MD5(?)
    `;

    startConnection((err, connection) => {
      if (err) {
        return callback(err, null);
      }

      connection.query(
        sql,
        [username, username, password],
        (queryErr, results) => {
          connectionRelease(connection); // Release the connection

          if (queryErr) {
            console.error("Database query error: 13", queryErr);
            return callback(
              { message: "Database query error", error: queryErr },
              null
            );
          }

          if (results.length === 0) {
            return callback(
              { message: "Incorrect password or username" },
              null
            );
          }

          callback(null, results);
        }
      );
    });
  },

  updatePassword: (new_password, admin_id, callback) => {
    const sql = `UPDATE \`admins\` SET \`password\` = MD5(?), \`reset_password_token\` = null, \`login_token\` = null, \`token_expiry\` = null, \`password_token_expiry\` = null WHERE \`id\` = ?`;

    startConnection((err, connection) => {
      if (err) {
        return callback(err, null);
      }

      connection.query(sql, [new_password, admin_id], (queryErr, results) => {
        connectionRelease(connection); // Release the connection

        if (queryErr) {
          console.error("Database query error: 14", queryerr);
          return callback(
            {
              message: "An error occurred while updating the password.",
              error: queryErr,
            },
            null
          );
        }

        // Check if the admin_id was found and the update affected any rows
        if (results.affectedRows === 0) {
          return callback(
            {
              message:
                "Admin not found or password not updated. Please check the provided details.",
            },
            null
          );
        }

        callback(null, {
          message: "Password updated successfully.",
          affectedRows: results.affectedRows,
        });
      });
    });
  },

  updateToken: (id, token, tokenExpiry, callback) => {
    const sql = `
      UPDATE \`admins\`
      SET \`login_token\` = ?, \`token_expiry\` = ?
      WHERE \`id\` = ?
    `;

    startConnection((err, connection) => {
      if (err) {
        return callback(err, null);
      }

      connection.query(sql, [token, tokenExpiry, id], (queryErr, results) => {
        connectionRelease(connection); // Release the connection

        if (queryErr) {
          console.error("Database query error: 15", queryErr);
          return callback(
            { message: "Database update error", error: queryErr },
            null
          );
        }

        if (results.affectedRows === 0) {
          return callback(
            {
              message:
                "Token update failed. Admin not found or no changes made.",
            },
            null
          );
        }
        callback(null, results);
      });
    });
  },

  setResetPasswordToken: (id, token, tokenExpiry, callback) => {
    const sql = `
      UPDATE \`admins\`
      SET \`reset_password_token\` = ?, \`password_token_expiry\` = ?
      WHERE \`id\` = ?
    `;

    startConnection((err, connection) => {
      if (err) {
        return callback(err, null);
      }

      connection.query(sql, [token, tokenExpiry, id], (queryErr, results) => {
        connectionRelease(connection); // Release the connection

        if (queryErr) {
          console.error("Database query error: 16", queryErr);
          return callback(
            { message: "Database update error", error: queryErr },
            null
          );
        }

        if (results.affectedRows === 0) {
          return callback(
            {
              message:
                "Token update failed. Admin not found or no changes made.",
            },
            null
          );
        }

        callback(null, results);
      });
    });
  },

  validateLogin: (id, callback) => {
    const sql = `
      SELECT \`login_token\`, \`token_expiry\`
      FROM \`admins\`
      WHERE \`id\` = ?
    `;

    startConnection((err, connection) => {
      if (err) {
        return callback(err, null);
      }

      connection.query(sql, [id], (queryErr, results) => {
        connectionRelease(connection); // Release the connection

        if (queryErr) {
          console.error("Database query error: 18", queryErr);
          return callback(
            { message: "Database query error", error: queryErr },
            null
          );
        }

        if (results.length === 0) {
          return callback({ message: "Admin not found" }, null);
        }

        callback(null, results);
      });
    });
  },

  // Clear login token and token expiry
  logout: (id, callback) => {
    const sql = `
        UPDATE \`admins\`
        SET \`login_token\` = NULL, \`token_expiry\` = NULL
        WHERE \`id\` = ?
      `;

    startConnection((err, connection) => {
      if (err) {
        return callback(err, null);
      }

      connection.query(sql, [id], (queryErr, results) => {
        connectionRelease(connection); // Release the connection

        if (queryErr) {
          console.error("Database query error: 19", queryErr);
          return callback(
            { message: "Database update error", error: queryErr },
            null
          );
        }

        if (results.affectedRows === 0) {
          return callback(
            {
              message:
                "Token clear failed. Admin not found or no changes made.",
            },
            null
          );
        }

        callback(null, results);
      });
    });
  },

  findById: (id, callback) => {
    const sql = `
      SELECT \`id\`, \`emp_id\`, \`name\`, \`profile_picture\`, \`date_of_joining\`, \`designation\`, \`role\`, \`email\`, \`mobile\`, \`status\`, \`login_token\`, \`token_expiry\`
      FROM \`admins\`
      WHERE \`id\` = ?
    `;

    startConnection((err, connection) => {
      if (err) {
        return callback(err, null);
      }

      connection.query(sql, [id], (queryErr, results) => {
        connectionRelease(connection); // Release the connection

        if (queryErr) {
          console.error("Database query error: 21", queryErr);
          return callback(
            { message: "Database query error", error: queryErr },
            null
          );
        }

        if (results.length === 0) {
          return callback({ message: "Admin not found" }, null);
        }

        callback(null, results[0]); // Return the first result (should be one result if ID is unique)
      });
    });
  },
};

module.exports = Admin;
