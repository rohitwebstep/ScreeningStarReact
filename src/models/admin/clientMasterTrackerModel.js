const crypto = require("crypto");
const pool = require("../../config/db");

// Function to hash the password using MD5
const hashPassword = (password) =>
  crypto.createHash("md5").update(password).digest("hex");

const Customer = {
  list: (filter_status, callback) => {
    let customers_id = [];

    if (filter_status && filter_status !== null && filter_status !== "") {
      // Query when `filter_status` exists
      const sql = `
        SELECT b.customer_id, b.id AS branch_id, b.name AS branch_name, COUNT(ca.id) AS application_count
        FROM client_applications ca
        INNER JOIN branches b ON ca.branch_id = b.id
        WHERE ca.status = ?
        GROUP BY b.customer_id, b.id, b.name;
      `;

      pool.query(sql, [filter_status], (err, results) => {
        if (err) {
          console.error("Database query error:", err);
          return callback(err, null);
        }

        // Loop through results and push customer_id to the array
        results.forEach((row) => {
          customers_id.push(row.customer_id);
        });

        let customersIDConditionString = "";
        if (customers_id.length > 0) {
          customersIDConditionString = ` AND customers.id IN (${customers_id.join(
            ","
          )})`;
        }

        const finalSql = `
          WITH BranchesCTE AS (
            SELECT 
              b.id AS branch_id,
              b.customer_id
            FROM 
              branches b
          )
          SELECT 
            customers.client_unique_id,
            customers.name,
            customer_metas.single_point_of_contact,
            customers.id AS main_id,
            COALESCE(branch_counts.branch_count, 0) AS branch_count,
            COALESCE(application_counts.application_count, 0) AS application_count
          FROM 
            customers
          LEFT JOIN 
            customer_metas ON customers.id = customer_metas.customer_id
          LEFT JOIN (
            SELECT 
              customer_id, 
              COUNT(*) AS branch_count
            FROM 
              branches
            GROUP BY 
              customer_id
          ) AS branch_counts ON customers.id = branch_counts.customer_id
          LEFT JOIN (
            SELECT 
              b.customer_id, 
              COUNT(ca.id) AS application_count
            FROM 
              BranchesCTE b
            INNER JOIN 
              client_applications ca ON b.branch_id = ca.branch_id
            WHERE 
              ca.status != 'closed'
            GROUP BY 
              b.customer_id
          ) AS application_counts ON customers.id = application_counts.customer_id
          WHERE 
            COALESCE(application_counts.application_count, 0) > 0
            ${customersIDConditionString};
        `;

        pool.query(finalSql, (err, results) => {
          if (err) {
            console.error("Database query error:", err);
            return callback(err, null);
          }
          callback(null, results);
        });
      });
    } else {
      // If no filter_status is provided, proceed with the final SQL query without filters
      const finalSql = `
        WITH BranchesCTE AS (
          SELECT 
            b.id AS branch_id,
            b.customer_id
          FROM 
            branches b
        )
        SELECT 
          customers.client_unique_id,
          customers.name,
          customer_metas.single_point_of_contact,
          customers.id AS main_id,
          COALESCE(branch_counts.branch_count, 0) AS branch_count,
          COALESCE(application_counts.application_count, 0) AS application_count
        FROM 
          customers
        LEFT JOIN 
          customer_metas ON customers.id = customer_metas.customer_id
        LEFT JOIN (
          SELECT 
            customer_id, 
            COUNT(*) AS branch_count
          FROM 
            branches
          GROUP BY 
            customer_id
        ) AS branch_counts ON customers.id = branch_counts.customer_id
        LEFT JOIN (
          SELECT 
            b.customer_id, 
            COUNT(ca.id) AS application_count
          FROM 
            BranchesCTE b
          INNER JOIN 
            client_applications ca ON b.branch_id = ca.branch_id
          WHERE 
            ca.status != 'closed'
          GROUP BY 
            b.customer_id
        ) AS application_counts ON customers.id = application_counts.customer_id
        WHERE 
          COALESCE(application_counts.application_count, 0) > 0;
      `;

      pool.query(finalSql, (err, results) => {
        if (err) {
          console.error("Database query error:", err);
          return callback(err, null);
        }
        callback(null, results);
      });
    }
  },

  listByCustomerID: (customer_id, callback) => {
    const sql = `SELECT b.id AS branch_id, b.name AS branch_name, COUNT(ca.id) AS application_count
FROM client_applications ca
INNER JOIN branches b ON ca.branch_id = b.id
WHERE ca.status != 'closed'
AND b.customer_id = ?
GROUP BY b.name;
`;
    pool.query(sql, [customer_id], (err, results) => {
      if (err) {
        console.error("Database query error:", err);
        return callback(err, null);
      }
      callback(null, results);
    });
  },

  applicationListByBranch: (branch_id, status, callback) => {
    let sql = `SELECT * FROM \`client_applications\` WHERE \`branch_id\` = ? AND \`status\` != 'closed'`;
    const params = [branch_id];

    // Check if status is not null and add the corresponding condition
    if (typeof status === "string" && status.trim() !== "") {
      sql += ` AND \`status\` = ?`;
      params.push(status);
    }

    pool.query(sql, params, (err, results) => {
      if (err) {
        console.error("Database query error:", err);
        return callback(err, null);
      }
      callback(null, results);
    });
  },

  applicationByID: (application_id, branch_id, callback) => {
    // Use a parameterized query to prevent SQL injection
    const sql =
      "SELECT * FROM `client_applications` WHERE `id` = ? AND `branch_id` = ?";
    pool.query(sql, [application_id, branch_id], (err, results) => {
      if (err) {
        console.error("Database query error:", err);
        return callback(err, null);
      }
      // Assuming `results` is an array, and we want the first result
      callback(null, results[0] || null); // Return single application or null if not found
    });
  },

  annexureData: (client_application_id, db_table, callback) => {
    // Check if the table exists in the information schema
    const checkTableSql = `
      SELECT COUNT(*) AS count 
      FROM information_schema.tables 
      WHERE table_schema = DATABASE() 
      AND table_name = ?`;

    pool.query(checkTableSql, [db_table], (err, results) => {
      if (err) {
        console.error("Database error while checking table existence:", err);
        return callback(err, null);
      }
      // If the table does not exist, return an error
      if (results[0].count === 0) {
        const createTableSql = `
        CREATE TABLE \`${db_table}\` (
          \`id\` bigint(20) NOT NULL AUTO_INCREMENT,
          \`cmt_id\` bigint(20) NOT NULL,
          \`client_application_id\` bigint(20) NOT NULL,
          \`branch_id\` int(11) NOT NULL,
          \`customer_id\` int(11) NOT NULL,
          \`status\` VARCHAR(100) NOT NULL,
          \`created_at\` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
          \`updated_at\` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          PRIMARY KEY (\`id\`),
          KEY \`client_application_id\` (\`client_application_id\`),
          KEY \`cmt_application_customer_id\` (\`customer_id\`),
          KEY \`cmt_application_cmt_id\` (\`cmt_id\`),
          CONSTRAINT \`fk_${db_table}_client_application_id\` FOREIGN KEY (\`client_application_id\`) REFERENCES \`client_applications\` (\`id\`) ON DELETE CASCADE,
          CONSTRAINT \`fk_${db_table}_customer_id\` FOREIGN KEY (\`customer_id\`) REFERENCES \`customers\` (\`id\`) ON DELETE CASCADE,
          CONSTRAINT \`fk_${db_table}_cmt_id\` FOREIGN KEY (\`cmt_id\`) REFERENCES \`cmt_applications\` (\`id\`) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`;

        pool.query(createTableSql, (createErr) => {
          if (createErr) {
            console.error(`Error creating table 1 "${db_table}":`, createErr);
            return callback(createErr);
          }
          fetchData();
        });
      } else {
        fetchData();
      }

      function fetchData() {
        // Now that we know the table exists, run the original query
        const sql = `SELECT * FROM \`${db_table}\` WHERE \`client_application_id\` = ?`;
        pool.query(sql, [client_application_id], (err, results) => {
          if (err) {
            console.error("Database query error:", err);
            return callback(err, null);
          }
          // Return the first result or null if not found
          callback(null, results[0] || null);
        });
      }
    });
  },

  filterOptions: (callback) => {
    const sql = `
        SELECT \`status\`, COUNT(*) AS \`count\` 
        FROM \`client_applications\` 
        GROUP BY \`status\`
    `;
    pool.query(sql, (err, results) => {
      if (err) {
        console.error("Database query error:", err);
        return callback(err, null);
      }
      callback(null, results);
    });
  },

  getCMTApplicationById: (client_application_id, callback) => {
    const sql =
      "SELECT * FROM `cmt_applications` WHERE `client_application_id` = ?";
    pool.query(sql, [`${client_application_id}`], (err, results) => {
      if (err) {
        console.error("Database query error:", err);
        return callback(err, null);
      }
      callback(null, results[0]);
    });
  },

  getCMTApplicationIDByClientApplicationId: (
    client_application_id,
    callback
  ) => {
    if (!client_application_id) {
      return callback(null, false);
    }

    const sql =
      "SELECT `id` FROM `cmt_applications` WHERE `client_application_id` = ?";

    pool.query(sql, [client_application_id], (err, results) => {
      if (err) {
        console.error("Database query error:", err);
        return callback(err, null);
      }

      if (results.length > 0) {
        return callback(null, results[0].id);
      }
      callback(null, false);
    });
  },

  getCMTAnnexureByApplicationId: (
    client_application_id,
    db_table,
    callback
  ) => {
    // 1. Check if the table exists
    const checkTableSql = `
      SELECT COUNT(*) AS count 
      FROM information_schema.tables 
      WHERE table_schema = ? AND table_name = ?`;

    pool.query(
      checkTableSql,
      [process.env.DB_NAME, db_table],
      (tableErr, tableResults) => {
        if (tableErr) {
          console.error("Error checking table existence:", tableErr);
          return callback(tableErr);
        }
        if (tableResults[0].count === 0) {
          const createTableSql = `
          CREATE TABLE \`${db_table}\` (
            \`id\` bigint(20) NOT NULL AUTO_INCREMENT,
            \`cmt_id\` bigint(20) NOT NULL,
            \`client_application_id\` bigint(20) NOT NULL,
            \`branch_id\` int(11) NOT NULL,
            \`customer_id\` int(11) NOT NULL,
            \`status\` VARCHAR(100) NOT NULL,
            \`created_at\` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
            \`updated_at\` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (\`id\`),
            KEY \`client_application_id\` (\`client_application_id\`),
            KEY \`cmt_application_customer_id\` (\`customer_id\`),
            KEY \`cmt_application_cmt_id\` (\`cmt_id\`),
            CONSTRAINT \`fk_${db_table}_client_application_id\` FOREIGN KEY (\`client_application_id\`) REFERENCES \`client_applications\` (\`id\`) ON DELETE CASCADE,
            CONSTRAINT \`fk_${db_table}_customer_id\` FOREIGN KEY (\`customer_id\`) REFERENCES \`customers\` (\`id\`) ON DELETE CASCADE,
            CONSTRAINT \`fk_${db_table}_cmt_id\` FOREIGN KEY (\`cmt_id\`) REFERENCES \`cmt_applications\` (\`id\`) ON DELETE CASCADE
          ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`;

          pool.query(createTableSql, (createErr) => {
            if (createErr) {
              console.error(`Error creating table 2 "${db_table}":`, createErr);
              return callback(createErr);
            }
            fetchData();
          });
        } else {
          fetchData();
        }

        function fetchData() {
          const sql = `SELECT * FROM \`${db_table}\` WHERE \`client_application_id\` = ?`;
          pool.query(sql, [client_application_id], (queryErr, results) => {
            if (queryErr) {
              console.error("Error executing query:", queryErr);
              return callback(queryErr);
            }
            const response = results.length > 0 ? results[0] : null;
            callback(null, response);
          });
        }
      }
    );
  },

  reportFormJsonByServiceID: (service_id, callback) => {
    // Use a parameterized query to prevent SQL injection
    const sql = "SELECT `json` FROM `report_forms` WHERE `id` = ?";
    pool.query(sql, [service_id], (err, results) => {
      if (err) {
        console.error("Database query error:", err);
        return callback(err, null);
      }
      // Assuming `results` is an array, and we want the first result
      callback(null, results[0] || null); // Return single application or null if not found
    });
  },

  generateReport: (
    mainJson,
    client_application_id,
    branch_id,
    customer_id,
    callback
  ) => {
    const fields = Object.keys(mainJson);

    // 1. Check for existing columns in cmt_applications
    const checkColumnsSql = `
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'cmt_applications' AND COLUMN_NAME IN (?)`;

    pool.query(checkColumnsSql, [fields], (err, results) => {
      if (err) {
        console.error("Error checking columns:", err);
        return callback(err, null);
      }

      const existingColumns = results.map((row) => row.COLUMN_NAME);
      const missingColumns = fields.filter(
        (field) => !existingColumns.includes(field)
      );

      // 2. Add missing columns if any
      const addMissingColumns = () => {
        if (missingColumns.length > 0) {
          const alterQueries = missingColumns.map((column) => {
            return `ALTER TABLE cmt_applications ADD COLUMN ${column} VARCHAR(255)`; // Adjust data type as needed
          });

          // Run all ALTER statements sequentially
          const alterPromises = alterQueries.map(
            (query) =>
              new Promise((resolve, reject) => {
                pool.query(query, (alterErr) => {
                  if (alterErr) {
                    console.error("Error adding column:", alterErr);
                    return reject(alterErr);
                  }
                  resolve();
                });
              })
          );

          return Promise.all(alterPromises);
        }
        return Promise.resolve(); // No missing columns, resolve immediately
      };

      // 3. Check if entry exists by client_application_id and insert/update accordingly
      const checkAndUpsertEntry = () => {
        const checkEntrySql =
          "SELECT * FROM cmt_applications WHERE client_application_id = ?";

        pool.query(
          checkEntrySql,
          [client_application_id],
          (entryErr, entryResults) => {
            if (entryErr) {
              console.error("Error checking entry existence:", entryErr);
              return callback(entryErr, null);
            }

            // Add branch_id and customer_id to mainJson
            mainJson.branch_id = branch_id;
            mainJson.customer_id = customer_id;

            if (entryResults.length > 0) {
              // Update existing entry
              const updateSql =
                "UPDATE cmt_applications SET ? WHERE client_application_id = ?";
              pool.query(
                updateSql,
                [mainJson, client_application_id],
                (updateErr, updateResult) => {
                  if (updateErr) {
                    console.error("Error updating application:", updateErr);
                    return callback(updateErr, null);
                  }
                  callback(null, updateResult);
                }
              );
            } else {
              // Insert new entry
              const insertSql = "INSERT INTO cmt_applications SET ?";
              pool.query(
                insertSql,
                { ...mainJson, client_application_id, branch_id, customer_id },
                (insertErr, insertResult) => {
                  if (insertErr) {
                    console.error("Error inserting application:", insertErr);
                    return callback(insertErr, null);
                  }
                  callback(null, insertResult);
                }
              );
            }
          }
        );
      };

      // Execute the operations in sequence
      addMissingColumns()
        .then(() => checkAndUpsertEntry())
        .catch((err) => {
          console.error("Error during ALTER or entry check:", err);
          callback(err, null);
        });
    });
  },

  createOrUpdateAnnexure: (
    cmt_id,
    client_application_id,
    branch_id,
    customer_id,
    db_table,
    mainJson,
    callback
  ) => {
    const fields = Object.keys(mainJson);

    // 1. Check if the table exists
    const checkTableSql = `
      SELECT COUNT(*) AS count 
      FROM information_schema.tables 
      WHERE table_schema = ? AND table_name = ?`;

    pool.query(
      checkTableSql,
      [process.env.DB_NAME, db_table],
      (tableErr, tableResults) => {
        if (tableErr) {
          console.error("Error checking table existence:", tableErr);
          return callback(tableErr, null);
        }
        if (tableResults[0].count === 0) {
          const createTableSql = `
          CREATE TABLE \`${db_table}\` (
            \`id\` bigint(20) NOT NULL AUTO_INCREMENT,
            \`cmt_id\` bigint(20) NOT NULL,
            \`client_application_id\` bigint(20) NOT NULL,
            \`branch_id\` int(11) NOT NULL,
            \`customer_id\` int(11) NOT NULL,
            \`status\` VARCHAR(100) NOT NULL,
            \`created_at\` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
            \`updated_at\` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (\`id\`),
            KEY \`client_application_id\` (\`client_application_id\`),
            KEY \`cmt_application_customer_id\` (\`customer_id\`),
            KEY \`cmt_application_cmt_id\` (\`cmt_id\`),
            CONSTRAINT \`fk_${db_table}_client_application_id\` FOREIGN KEY (\`client_application_id\`) REFERENCES \`client_applications\` (\`id\`) ON DELETE CASCADE,
            CONSTRAINT \`fk_${db_table}_customer_id\` FOREIGN KEY (\`customer_id\`) REFERENCES \`customers\` (\`id\`) ON DELETE CASCADE,
            CONSTRAINT \`fk_${db_table}_cmt_id\` FOREIGN KEY (\`cmt_id\`) REFERENCES \`cmt_applications\` (\`id\`) ON DELETE CASCADE
          ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`;

          pool.query(createTableSql, (createErr) => {
            if (createErr) {
              console.error("Error creating table 3 :", createErr);
              return callback(createErr, null);
            }
            proceedToCheckColumns();
          });
        } else {
          proceedToCheckColumns();
        }

        function proceedToCheckColumns() {
          const checkColumnsSql = `
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME = ? AND COLUMN_NAME IN (?)`;

          pool.query(checkColumnsSql, [db_table, fields], (err, results) => {
            if (err) {
              console.error("Error checking columns:", err);
              return callback(err, null);
            }

            const existingColumns = results.map((row) => row.COLUMN_NAME);
            const missingColumns = fields.filter(
              (field) => !existingColumns.includes(field)
            );

            // 4. Add missing columns
            if (missingColumns.length > 0) {
              const alterQueries = missingColumns.map((column) => {
                return `ALTER TABLE \`${db_table}\` ADD COLUMN \`${column}\` VARCHAR(255)`; // Adjust data type as necessary
              });

              // Run all ALTER statements in sequence
              const alterPromises = alterQueries.map(
                (query) =>
                  new Promise((resolve, reject) => {
                    pool.query(query, (alterErr) => {
                      if (alterErr) {
                        console.error("Error adding column:", alterErr);
                        return reject(alterErr);
                      }
                      resolve();
                    });
                  })
              );

              Promise.all(alterPromises)
                .then(() => checkAndUpdateEntry())
                .catch((err) => {
                  console.error("Error executing ALTER statements:", err);
                  callback(err, null);
                });
            } else {
              checkAndUpdateEntry();
            }
          });
        }

        function checkAndUpdateEntry() {
          // 5. Check if entry exists by client_application_id
          const checkEntrySql = `SELECT * FROM \`${db_table}\` WHERE client_application_id = ?`;
          pool.query(
            checkEntrySql,
            [client_application_id],
            (entryErr, entryResults) => {
              if (entryErr) {
                console.error("Error checking entry existence:", entryErr);
                return callback(entryErr, null);
              }

              // 6. Insert or update the entry
              if (entryResults.length > 0) {
                const updateSql = `UPDATE \`${db_table}\` SET ? WHERE client_application_id = ?`;
                pool.query(
                  updateSql,
                  [mainJson, client_application_id],
                  (updateErr, updateResult) => {
                    if (updateErr) {
                      console.error("Error updating application:", updateErr);
                      return callback(updateErr, null);
                    }
                    callback(null, updateResult);
                  }
                );
              } else {
                const insertSql = `INSERT INTO \`${db_table}\` SET ?`;
                pool.query(
                  insertSql,
                  {
                    ...mainJson,
                    client_application_id,
                    branch_id,
                    customer_id,
                    cmt_id, // Include cmt_id in the insert statement
                  },
                  (insertErr, insertResult) => {
                    if (insertErr) {
                      console.error("Error inserting application:", insertErr);
                      return callback(insertErr, null);
                    }
                    callback(null, insertResult);
                  }
                );
              }
            }
          );
        }
      }
    );
  },

  upload: (
    client_application_id,
    db_table,
    db_column,
    savedImagePaths,
    callback
  ) => {
    // Step 1: Check if the table exists
    const checkTableSql = `
      SELECT COUNT(*) AS count 
      FROM information_schema.tables 
      WHERE table_schema = DATABASE() 
      AND table_name = ?`;

    pool.query(checkTableSql, [db_table], (tableErr, tableResults) => {
      if (tableErr) {
        console.error("Error checking table existence:", tableErr);
        return callback(false, {
          error: "Error checking table existence.",
          details: tableErr,
        });
      }

      // Step 2: If table does not exist, create it
      if (tableResults[0].count === 0) {
        console.log(`Table does not exist, creating table: ${db_table}`);
        const createTableSql = `
          CREATE TABLE \`${db_table}\` (
            \`id\` bigint(20) NOT NULL AUTO_INCREMENT,
            \`cmt_id\` bigint(20) NOT NULL,
            \`client_application_id\` bigint(20) NOT NULL,
            \`branch_id\` int(11) NOT NULL,
            \`customer_id\` int(11) NOT NULL,
            \`status\` VARCHAR(100) NOT NULL,
            \`created_at\` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
            \`updated_at\` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (\`id\`),
            KEY \`client_application_id\` (\`client_application_id\`),
            KEY \`cmt_application_customer_id\` (\`customer_id\`),
            KEY \`cmt_application_cmt_id\` (\`cmt_id\`),
            CONSTRAINT \`fk_${db_table}_client_application_id\` FOREIGN KEY (\`client_application_id\`) REFERENCES \`client_applications\` (\`id\`) ON DELETE CASCADE,
            CONSTRAINT \`fk_${db_table}_customer_id\` FOREIGN KEY (\`customer_id\`) REFERENCES \`customers\` (\`id\`) ON DELETE CASCADE,
            CONSTRAINT \`fk_${db_table}_cmt_id\` FOREIGN KEY (\`cmt_id\`) REFERENCES \`cmt_applications\` (\`id\`) ON DELETE CASCADE
          ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`;

        pool.query(createTableSql, (createErr) => {
          if (createErr) {
            console.error("Error creating table:", createErr);
            return callback(false, {
              error: "Error creating table.",
              details: createErr,
            });
          }
          // After creating the table, check for missing columns
          proceedToCheckColumns();
        });
      } else {
        // If table exists, check for missing columns
        proceedToCheckColumns();
      }

      // Function to check for missing columns and perform the update
      function proceedToCheckColumns() {
        // Step 1: Get the current columns in the table
        const currentColumnsSql = `
          SELECT COLUMN_NAME 
          FROM information_schema.columns 
          WHERE table_schema = DATABASE() 
          AND table_name = ?`;

        pool.query(currentColumnsSql, [db_table], (err, results) => {
          if (err) {
            return callback(false, {
              error: "Error fetching current columns.",
              details: err,
            });
          }

          // Extract the column names from the results
          const existingColumns = results.map((row) => row.COLUMN_NAME);

          // Step 2: Define the columns you expect
          const expectedColumns = [db_column]; // Add more expected columns as needed

          const missingColumns = expectedColumns.filter(
            (column) => !existingColumns.includes(column)
          );

          // Step 3: Add missing columns
          const addColumnPromises = missingColumns.map((column) => {
            const addColumnSql = `ALTER TABLE \`${db_table}\` ADD \`${column}\` VARCHAR(255) NOT NULL`;
            return new Promise((resolveAdd, rejectAdd) => {
              pool.query(addColumnSql, (addErr) => {
                if (addErr) {
                  return rejectAdd(addErr);
                }
                resolveAdd();
              });
            });
          });

          // Step 4: Wait for all column additions to complete
          Promise.all(addColumnPromises)
            .then(() => {
              const sqlUpdateCustomer = `
                UPDATE ${db_table} 
                SET ${db_column} = ?
                WHERE client_application_id = ?`;

              // Prepare the parameters for the query
              const queryParams = [savedImagePaths, client_application_id];

              pool.query(sqlUpdateCustomer, queryParams, (err, results) => {
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
                    error:
                      "No rows updated. Please check the client application ID.",
                    details: results,
                    query: sqlUpdateCustomer,
                    params: queryParams, // Return the parameters used in the query
                  });
                }
              });
            })
            .catch((error) => {
              // Handle errors from adding missing columns
              return callback(false, {
                error: "Error adding missing columns.",
                details: error,
              });
            });
        });
      }
    });
  },

  getAttachmentsByClientAppID: (client_application_id, callback) => {
    const sql = "SELECT `services` FROM `client_applications` WHERE `id` = ?";
    pool.query(sql, [client_application_id], (err, results) => {
      if (err) {
        console.error("Database query error:", err);
        return callback(err, null);
      }

      if (results.length > 0) {
        const services = results[0].services.split(","); // Split services by comma
        const dbTableFileInputs = {}; // Object to store db_table and its file inputs
        let completedQueries = 0; // To track completed queries

        // Step 1: Loop through each service and perform actions
        services.forEach((service) => {
          const query = "SELECT `json` FROM `report_forms` WHERE `id` = ?";
          pool.query(query, [service], (err, result) => {
            completedQueries++;

            if (err) {
              console.error("Error fetching JSON for service:", service, err);
            } else if (result.length > 0) {
              try {
                // Parse the JSON data
                const jsonData = JSON.parse(result[0].json);
                const dbTable = jsonData.db_table;

                // Initialize an array for the dbTable if not already present
                if (!dbTableFileInputs[dbTable]) {
                  dbTableFileInputs[dbTable] = [];
                }

                // Extract inputs with type 'file' and add to the db_table array
                jsonData.rows.forEach((row) => {
                  row.inputs.forEach((input) => {
                    if (input.type === "file") {
                      dbTableFileInputs[dbTable].push(input.name);
                    }
                  });
                });
              } catch (parseErr) {
                console.error(
                  "Error parsing JSON for service:",
                  service,
                  parseErr
                );
              }
            }

            // When all services have been processed
            if (completedQueries === services.length) {
              // Fetch the host from the database
              const hostSql = `SELECT \`host\` FROM \`app_info\` WHERE \`status\` = 1 AND \`interface_type\` = ? ORDER BY \`updated_at\` DESC LIMIT 1`;
              pool.query(hostSql, ["backend"], (err, hostResults) => {
                if (err) {
                  console.error("Database query error:", err);
                  return callback(err, null);
                }

                // Check if an entry was found for the host
                const host =
                  hostResults.length > 0
                    ? hostResults[0].host
                    : "www.example.com"; // Fallback host

                let finalAttachments = [];
                let tableQueries = 0;
                const totalTables = Object.keys(dbTableFileInputs).length;

                // Loop through each db_table and perform a query
                for (const [dbTable, fileInputNames] of Object.entries(
                  dbTableFileInputs
                )) {
                  const selectQuery = `SELECT ${fileInputNames.join(
                    ", "
                  )} FROM ${dbTable} WHERE client_application_id = ?`;

                  pool.query(
                    selectQuery,
                    [client_application_id],
                    (err, rows) => {
                      tableQueries++;

                      if (err) {
                        console.error(`Error querying table ${dbTable}:`, err);
                      } else {
                        // Combine values from each row into a single string
                        rows.forEach((row) => {
                          const attachments = Object.values(row)
                            .filter((value) => value) // Remove any falsy values
                            .join(","); // Join values by comma

                          // Split and concatenate the URL with each attachment
                          attachments.split(",").forEach((attachment) => {
                            finalAttachments.push(`${host}/${attachment}`);
                          });
                        });
                      }

                      // Step 3: When all db_table queries are completed, return finalAttachments
                      if (tableQueries === totalTables) {
                        callback(null, finalAttachments.join(", "));
                      }
                    }
                  );
                }
              });
            }
          });
        });
      } else {
        callback(null, []); // Return an empty array if no results found
      }
    });
  },
};

module.exports = Customer;
