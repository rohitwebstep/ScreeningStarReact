const crypto = require("crypto");
const {
  pool,
  startConnection,
  connectionRelease,
} = require("../../../config/db");

// Generates a new random token
const generateToken = () => crypto.randomBytes(32).toString("hex");

// Returns the expiry time for the token (1 hour from now)
const getTokenExpiry = () => new Date(Date.now() + 3600000);

const common = {
  isBranchTokenValid: (_token, sub_user_id, branch_id, callback) => {
    if (typeof callback !== "function") {
      console.error("Callback is not a function");
      return;
    }

    let sql;
    let queryParams;
    let currentRole;

    // Validate sub_user_id or branch_id
    if (sub_user_id != null) {
      if (
        (typeof sub_user_id === "string" && sub_user_id.trim() !== "") ||
        (typeof sub_user_id === "number" && sub_user_id > 0)
      ) {
        sql = `SELECT \`login_token\`, \`token_expiry\` FROM \`branch_sub_users\` WHERE \`id\` = ?`;
        queryParams = [sub_user_id]; // Querying by sub_user_id
        currentRole = "Sub User";
        console.log("Querying by sub_user_id:", sub_user_id);
      } else {
        // If no sub_user_id, query the `branches` table
        if (branch_id != null) {
          sql = `SELECT \`login_token\`, \`token_expiry\` FROM \`branches\` WHERE \`id\` = ?`;
          queryParams = [branch_id]; // Querying by branch_id
          currentRole = "Branch";
          console.log("Querying by branch_id:", branch_id);
        } else {
          console.error("Neither sub_user_id nor branch_id provided.");
          return callback({ status: false, message: "Missing identifiers" }, null);
        }
      }
    } else {
      sql = `SELECT \`login_token\`, \`token_expiry\` FROM \`branches\` WHERE \`id\` = ?`;
      queryParams = [branch_id]; // Querying by branch_id
      currentRole = "Branch";
      console.log("Querying by branch_id:", branch_id);
    }

    // Ensure sql is defined
    if (!sql) {
      console.error("SQL query is undefined.");
      return callback({ status: false, message: "Invalid query" }, null);
    }

    startConnection((err, connection) => {
      if (err) {
        console.error("Connection error:", err);
        return callback({ status: false, message: "Connection error" }, null);
      }

      connection.query(sql, queryParams, (err, results) => {
        if (err) {
          connectionRelease(connection);
          console.error("Database query error:", err);
          return callback({ status: false, message: "Database error" }, null);
        }

        // If no results are found, the branch or sub-user doesn't exist
        if (results.length === 0) {
          connectionRelease(connection);
          return callback(
            { status: false, message: `${currentRole} not found` },
            null
          );
        }

        const currentToken = results[0].login_token;
        const tokenExpiry = new Date(results[0].token_expiry);
        const currentTime = new Date();

        // Check if the provided token matches the stored token
        if (_token !== currentToken) {
          connectionRelease(connection);
          return callback(
            { status: false, message: "Invalid token provided" },
            null
          );
        }

        // If the token hasn't expired
        if (tokenExpiry > currentTime) {
          connectionRelease(connection);
          return callback(null, { status: true, message: "Token is valid" });
        } else {
          connectionRelease(connection);
          return callback(null, { status: true, message: "Token is valid" });
          // If the token has expired, refresh it
          const newToken = generateToken();
          const newTokenExpiry = getTokenExpiry();

          // Use the correct table depending on whether it's a sub-user or branch
          const updateSql = sub_user_id
            ? `UPDATE \`branch_sub_users\` SET \`login_token\` = ?, \`token_expiry\` = ? WHERE \`id\` = ?`
            : `UPDATE \`branches\` SET \`login_token\` = ?, \`token_expiry\` = ? WHERE \`id\` = ?`;

          connection.query(
            updateSql,
            [newToken, newTokenExpiry, sub_user_id || branch_id],
            (updateErr) => {
              connectionRelease(connection); // Release connection after updating

              if (updateErr) {
                console.error("Error updating token:", updateErr);
                return callback(
                  { status: false, message: "Error updating token" },
                  null
                );
              }

              callback(null, {
                status: true,
                message: "Token was expired and has been refreshed",
                newToken,
              });
            }
          );
        }
      });
    });
  },


  branchLoginLog: (branch_id, action, result, error, callback) => {
    if (typeof callback !== "function") {
      console.error("Callback is not a function 5");
      return;
    }

    const insertSql = `
      INSERT INTO \`branch_login_logs\` (\`branch_id\`, \`action\`, \`result\`, \`error\`, \`created_at\`)
      VALUES (?, ?, ?, ?, NOW())
    `;

    startConnection((err, connection) => {
      if (err) {
        console.error("Connection error:", err);
        return callback({ status: false, message: "Connection error" }, null);
      }

      connection.query(insertSql, [branch_id, action, result, error], (err) => {
        connectionRelease(connection); // Release connection

        if (err) {
          console.error("Database insertion error:", err);
          return callback({ status: false, message: "Database error" }, null);
        }

        callback(null, {
          status: true,
          message: "Branch login log entry added successfully",
        });
      });
    });
  },

  branchActivityLog: (
    branch_id,
    module,
    action,
    result,
    update,
    error,
    callback
  ) => {
    if (typeof callback !== "function") {
      console.error("Callback is not a function 6");
      return;
    }

    const insertSql = `
      INSERT INTO \`branch_activity_logs\` (\`branch_id\`, \`module\`, \`action\`, \`result\`, \`update\`, \`error\`, \`created_at\`)
      VALUES (?, ?, ?, ?, ?, ?, NOW())
    `;

    startConnection((err, connection) => {
      if (err) {
        console.error("Connection error:", err);
        return callback({ status: false, message: "Connection error" }, null);
      }

      connection.query(
        insertSql,
        [branch_id, module, action, result, update, error],
        (err) => {
          connectionRelease(connection); // Release connection

          if (err) {
            console.error("Database insertion error:", err);
            return callback({ status: false, message: "Database error" }, null);
          }

          callback(null, {
            status: true,
            message: "Branch activity log entry added successfully",
          });
        }
      );
    });
  },

  isBranchAuthorizedForAction: (branch_id, action, callback) => {
    const sql = `
      SELECT \`permissions\`
      FROM \`branches\`
      WHERE \`id\` = ?
    `;

    startConnection((err, connection) => {
      if (err) {
        console.error("Connection error:", err);
        return callback({ status: false, message: "Connection error" }, null);
      }

      connection.query(sql, [branch_id], (err, results) => {
        connectionRelease(connection); // Release connection

        if (err) {
          console.error("Database query error: 118", err);
          return callback(
            { status: false, message: "Database query error" },
            null
          );
        }
        if (results.length === 0) {
          return callback({ status: false, message: "Branch not found" }, null);
        }

        const permissionsRaw = results[0].permissions;

        // Check if permissions field is empty or null
        if (!permissionsRaw) {
          console.error("Permissions field is empty");
          return callback({
            status: false,
            message: "Access Denied",
          });
        }
        // Console log the json
        const permissionsJson = JSON.parse(permissionsRaw);
        const permissions =
          typeof permissionsJson === "string"
            ? JSON.parse(permissionsJson)
            : permissionsJson;

        // Check if the action type exists in the permissions object
        if (!permissions[action]) {
          console.error("Action type not found in permissions");
          return callback({
            status: false,
            message: "Access Denied",
          });
        }
        return callback({
          status: true,
          message: "Authorization Successful",
        });
      });
    });
  },

  getBranchandCustomerEmailsForNotification: (branch_id, callback) => {
    if (typeof callback !== "function") {
      console.error("Callback is not a function 7");
      return;
    }

    // First query to get branch email and customer_id from the branches table
    const branchSql = `
      SELECT \`name\`, \`email\`, \`customer_id\`
      FROM \`branches\`
      WHERE \`id\` = ?
    `;

    startConnection((err, connection) => {
      if (err) {
        console.error("Connection error:", err);
        return callback({ status: false, message: "Connection error" }, null);
      }

      connection.query(branchSql, [branch_id], (err, branchResults) => {
        if (err) {
          connectionRelease(connection);
          console.error("Database query error: 119", err);
          return callback({ status: false, message: "Database error" }, null);
        }

        if (branchResults.length === 0) {
          connectionRelease(connection);
          return callback({ status: false, message: "Branch not found" }, null);
        }

        const branch = branchResults[0];
        const customerId = branch.customer_id;

        // Second query to get customer email from the customers table
        const customerSql = `
          SELECT \`emails\`, \`name\`
          FROM \`customers\`
          WHERE \`id\` = ?
        `;

        connection.query(customerSql, [customerId], (err, customerResults) => {
          connectionRelease(connection); // Release connection

          if (err) {
            console.error("Database query error:", err);
            return callback({ status: false, message: "Database error" }, null);
          }

          if (customerResults.length === 0) {
            return callback(
              { status: false, message: "Customer not found" },
              null
            );
          }

          const customer = customerResults[0];

          // Return both branch and customer emails
          callback(null, {
            status: true,
            message: "Emails retrieved successfully",
            branch,
            customer,
          });
        });
      });
    });
  },

  getCustomerNameByBranchID: (branch_id, callback) => {
    if (typeof callback !== "function") {
      console.error("Callback is not a function 8");
      return;
    }

    // First query to get customer_id from the branches table
    const branchSql = `
      SELECT \`customer_id\`
      FROM \`branches\`
      WHERE \`id\` = ?
    `;

    startConnection((err, connection) => {
      if (err) {
        console.error("Connection error:", err);
        return callback({ status: false, message: "Connection error" }, null);
      }

      connection.query(branchSql, [branch_id], (err, branchResults) => {
        if (err) {
          connectionRelease(connection);
          console.error("Database query error: 120", err);
          return callback({ status: false, message: "Database error" }, null);
        }

        if (branchResults.length === 0) {
          connectionRelease(connection);
          return callback({ status: false, message: "Branch not found" }, null);
        }

        const branch = branchResults[0];
        const customerId = branch.customer_id;

        // Second query to get customer name from the customers table
        const customerSql = `
          SELECT \`name\`
          FROM \`customers\`
          WHERE \`id\` = ?
        `;

        connection.query(customerSql, [customerId], (err, customerResults) => {
          connectionRelease(connection); // Release connection

          if (err) {
            console.error("Database query error: 121", err);
            return callback({ status: false, message: "Database error" }, null);
          }

          if (customerResults.length === 0) {
            return callback(
              { status: false, message: "Customer not found" },
              null
            );
          }

          const customer = customerResults[0];

          // Return the branch ID and customer name
          callback(null, {
            status: true,
            message: "Customer name retrieved successfully",
            customer_name: customer.name,
            branch_id: branch_id,
          });
        });
      });
    });
  },

  reportReadylist: (branch_id, callback) => {
    // SQL query to retrieve applications, customers, branches, and tat_days
    const applicationsQuery = `
      SELECT 
        cmt.report_date, 
        cmt.report_generate_by, 
        ad_report.name AS report_generator_name,
        cmt.qc_done_by, 
        ad_qc.name AS qc_done_by_name,
        ca.id AS client_application_id, 
        ca.is_priority, 
        ca.customer_id, 
        ca.branch_id, 
        ca.application_id, 
        ca.name AS application_name, 
        ca.created_at AS application_created_at, 
        cust.name AS customer_name, 
        cust.client_unique_id AS customer_unique_id, 
        br.name AS branch_name
      FROM client_applications AS ca
      JOIN customers AS cust ON cust.id = ca.customer_id
      JOIN branches AS br ON br.id = ca.branch_id
      LEFT JOIN customer_metas AS cm ON cm.customer_id = cust.id
      LEFT JOIN cmt_applications AS cmt ON ca.id = cmt.client_application_id
      LEFT JOIN admins AS ad_report ON ad_report.id = cmt.report_generate_by
      LEFT JOIN admins AS ad_qc ON ad_qc.id = cmt.qc_done_by
      WHERE cmt.report_date IS NOT NULL 
        AND TRIM(cmt.report_date) != '0000-00-00'
        AND TRIM(cmt.report_date) != ''
        AND cmt.overall_status IN ('complete', 'completed')
        AND (cmt.is_verify = 'yes' OR cmt.is_verify = 1 OR cmt.is_verify = '1')
        AND ca.branch_id = ?;
    `;

    startConnection((connectionError, connection) => {
      if (connectionError) {
        return callback(connectionError, null);
      }

      connection.query(
        applicationsQuery,
        [branch_id],
        (appQueryError, applicationResults) => {
          if (appQueryError) {
            return handleQueryError(appQueryError, connection, callback);
          }

          const finalResults = {};

          applicationResults.forEach((row) => {
            const customerId = row.customer_id;

            // Initialize customer if it doesn't exist
            if (!finalResults[customerId]) {
              finalResults[customerId] = {
                customer_id: row.customer_id,
                customer_name: row.customer_name,
                customer_unique_id: row.customer_unique_id,
                branches: [],
              };
            }

            // Find the branch in the customer's branches array
            let branch = finalResults[customerId].branches.find(
              (b) => b.branch_id === row.branch_id
            );

            // If branch doesn't exist, create and add it
            if (!branch) {
              branch = {
                branch_id: row.branch_id,
                branch_name: row.branch_name,
                applications: [],
              };
              finalResults[customerId].branches.push(branch);
            }

            // Add the application to the branch
            branch.applications.push({
              id: row.client_application_id,
              application_id: row.application_id,
              application_name: row.application_name,
              application_created_at: row.application_created_at,
              report_date: row.report_date,
              report_generate_by: row.report_generator_name,
              qc_done_by: row.qc_done_by_name,
              is_priority: row.is_priority,
            });
          });

          // Convert finalResults object to an array
          const resultArray = Object.values(finalResults);

          // Return the final structured data as an array
          return callback(null, resultArray);
        }
      );
    });
  },
};

module.exports = common;
