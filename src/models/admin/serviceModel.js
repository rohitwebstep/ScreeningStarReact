const pool = require("../../config/db");

const Service = {
  create: (title, description, admin_id, package_id, callback) => {
    // Step 1: Check if a package with the same title already exists
    const checkPackageSql = `
      SELECT * FROM \`packages\` WHERE \`title\` = ?
    `;

    pool.query(checkPackageSql, [title], (err, packageResults) => {
      if (err) {
        console.error("Error checking package:", err);
        return callback(err, null);
      }

      // Step 2: If a package with the same title exists, return an error
      if (packageResults.length > 0) {
        const error = new Error("Package with the same name already exists");
        console.error(error.message);
        return callback(error, null);
      }

      // Step 3: Check if a service with the same title already exists
      const checkServiceSql = `
        SELECT * FROM \`services\` WHERE \`title\` = ?
      `;
      pool.query(checkServiceSql, [title], (err, serviceResults) => {
        if (err) {
          console.error("Error checking service:", err);
          return callback(err, null);
        }

        // Step 4: If a service with the same title exists, return an error
        if (serviceResults.length > 0) {
          const error = new Error("Service with the same name already exists");
          console.error(error.message);
          return callback(error, null);
        }

        // Step 5: Insert the new service
        const insertServiceSql = `
          INSERT INTO \`services\` (\`title\`, \`description\`, \`admin_id\`, \`package_id\`)
          VALUES (?, ?, ?, ?)
        `;

        pool.query(insertServiceSql, [title, description, admin_id, package_id], (err, results) => {
          if (err) {
            console.error("Database query error:", err);
            return callback(err, null);
          }
          callback(null, results);
        });
      });
    });
  },

  list: (callback) => {
    const sql = `SELECT * FROM \`services\``;
    pool.query(sql, (err, results) => {
      if (err) {
        console.error("Database query error:", err);
        return callback(err, null);
      }
      callback(null, results);
    });
  },

  getServiceById: (id, callback) => {
    const sql = `SELECT * FROM \`services\` WHERE \`id\` = ?`;
    pool.query(sql, [id], (err, results) => {
      if (err) {
        console.error("Database query error:", err);
        return callback(err, null);
      }
      callback(null, results[0]);
    });
  },

  update: (id, title, description, package_id, callback) => {
    const sql = `
      UPDATE \`services\`
      SET \`title\` = ?, \`description\` = ?, \`package_id\` = ?
      WHERE \`id\` = ?
    `;
    pool.query(sql, [title, description, package_id, id], (err, results) => {
      if (err) {
        console.error("Database query error:", err);
        return callback(err, null);
      }
      callback(null, results);
    });
  },

  delete: (id, callback) => {
    const sql = `
        DELETE FROM \`services\`
        WHERE \`id\` = ?
      `;
    pool.query(sql, [id], (err, results) => {
      if (err) {
        console.error("Database query error:", err);
        return callback(err, null);
      }
      callback(null, results);
    });
  },
};

module.exports = Service;