const crypto = require("crypto");
const { pool, startConnection, connectionRelease } = require("../../config/db");

// Function to hash the password using MD5
const hashPassword = (password) =>
  crypto.createHash("md5").update(password).digest("hex");

const generateInvoiceModel = {
  generateInvoice: (customerId, callback) => {
    // Start connection to the database
    startConnection((err, connection) => {
      if (err) {
        return callback(
          { message: "Failed to connect to the database", error: err },
          null
        );
      }

      // Select only necessary customer details
      const customerQuery = `
        SELECT id, client_unique_id, name, emails, mobile, services
        FROM customers
        WHERE id = ?;
      `;

      connection.query(customerQuery, [customerId], (err, customerResults) => {
        if (err) {
          connectionRelease(connection);
          console.error(
            "Database query error while fetching customer information:",
            err
          );
          return callback(err, null);
        }

        // Check if customer exists
        if (customerResults.length === 0) {
          connectionRelease(connection);
          return callback(new Error("Customer not found."), null);
        }

        const applicationQuery = `
          SELECT id, branch_id, application_id, employee_id, name, services, status, created_at
          FROM client_applications
          WHERE (status = 'completed' OR status = 'closed') 
          AND customer_id = ? 
          ORDER BY branch_id;
        `;

        connection.query(
          applicationQuery,
          [customerId],
          (err, applicationResults) => {
            if (err) {
              connectionRelease(connection);
              console.error(
                "Database query error while fetching applications:",
                err
              );
              return callback(err, null);
            }

            // Map to group applications by branch ID
            const branchApplicationsMap = {};

            // Organize applications by branch
            applicationResults.forEach((application) => {
              const branchId = application.branch_id;

              // Initialize the branch entry if it does not exist
              if (!branchApplicationsMap[branchId]) {
                branchApplicationsMap[branchId] = {
                  id: branchId,
                  applications: [],
                };
              }

              // Push the application into the corresponding branch's array
              branchApplicationsMap[branchId].applications.push(application);
            });

            // Prepare to fetch branch details for each unique branch ID
            const branchesWithApplications = [];
            const branchIds = Object.keys(branchApplicationsMap);
            const branchPromises = branchIds.map((branchId) => {
              return new Promise((resolve, reject) => {
                const branchQuery = `
                SELECT id, name 
                FROM branches 
                WHERE id = ?;
              `;

                connection.query(
                  branchQuery,
                  [branchId],
                  (err, branchResults) => {
                    if (err) {
                      return reject(err);
                    }
                    if (branchResults.length > 0) {
                      const branch = branchResults[0];
                      branchesWithApplications.push({
                        id: branch.id,
                        name: branch.name, // Assuming branch has a name field
                        applications:
                          branchApplicationsMap[branchId].applications, // Applications of this branch
                      });
                    }
                    resolve();
                  }
                );
              });
            });

            // Wait for all branch queries to complete
            Promise.all(branchPromises)
              .then(() => {
                // Compile the final results
                const finalResults = {
                  customerInfo: customerResults[0], // Select the first customer record
                  applicationsByBranch: branchesWithApplications, // Updated structured data
                };
                connectionRelease(connection);
                callback(null, finalResults);
              })
              .catch((err) => {
                connectionRelease(connection);
                console.error("Error while fetching branch details:", err);
                callback(err, null);
              });
          }
        );
      });
    });
  },
};

module.exports = generateInvoiceModel;
