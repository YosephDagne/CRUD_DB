const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(express.json());

// Database connection settings
const connection = mysql.createConnection({
  host: "localhost",
  user: "crudDB",
  password: "crudDB",
  database: "crudDB",
});

connection.connect((err) => {
  if (err) {
    console.error("Error connecting to database:", err);
    return;
  }
  console.log("Connected to MySQL");
});

// Route: /create-table => To create the tables
app.get("/create-table", (req, res) => {
  const queries = [
    `CREATE TABLE IF NOT EXISTS customers(customer_id INT AUTO_INCREMENT, name VARCHAR(255) NOT NULL, PRIMARY KEY (customer_id))`,
    `CREATE TABLE IF NOT EXISTS address(address_id INT AUTO_INCREMENT, customer_id INT NOT NULL, address VARCHAR(255) NOT NULL, PRIMARY KEY (address_id), FOREIGN KEY (customer_id) REFERENCES customers (customer_id))`,
    `CREATE TABLE IF NOT EXISTS company(company_id INT AUTO_INCREMENT, customer_id INT NOT NULL, company VARCHAR(255) NOT NULL, PRIMARY KEY (company_id), FOREIGN KEY (customer_id) REFERENCES customers (customer_id))`,
  ];

  queries.forEach((query) => {
    connection.query(query, (err, results) => {
      if (err) {
        console.error(`Error creating table: ${err}`);
        return;
      }
      console.log("Table created or already exists");
    });
  });

  res.send("Tables Created");
});

// Route: /insert-customers-info => To insert data to the tables
app.post("/insert-customers-info", (req, res) => {
  const { name, address, company } = req.body;

  const insertName = `INSERT INTO customers (name) VALUES (?)`;
  const insertAddress = `INSERT INTO address (customer_id, address) VALUES (?, ?)`;
  const insertCompany = `INSERT INTO company (customer_id, company) VALUES (?, ?)`;

  connection.query(insertName, [name], (err, results) => {
    if (err) {
      console.error(`Error inserting data: ${err}`);
      return res.status(500).json({ error: "Failed to insert data" });
    }

    const customerId = results.insertId;

    connection.query(insertAddress, [customerId, address], (err) => {
      if (err) {
        console.error(`Error inserting address: ${err}`);
      }
    });

    connection.query(insertCompany, [customerId, company], (err) => {
      if (err) {
        console.error(`Error inserting company: ${err}`);
      }
      res.send("Data inserted successfully!");
    });
  });
});

// Route: /customers => To retrieve customized data from the tables
app.get("/customers", (req, res) => {
  const query = `SELECT customers.customer_id AS id, customers.name, address.address, company.company 
                 FROM customers 
                 JOIN address ON customers.customer_id = address.customer_id
                 JOIN company ON customers.customer_id = company.customer_id`;

  connection.query(query, (err, results) => {
    if (err) {
      console.error("Error fetching data:", err);
      return res.status(500).json({ error: "Failed to fetch data" });
    }
    res.send(results);
  });
});

const port = 1234;
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
// Route: /update => To adjust or update data from the tables
app.put("/update", (req, res) => {
  const { newName, id } = req.body;
  let updateName = `UPDATE customers SET name = ? WHERE customer_id = ?`;
  connection.query(updateName, [newName, id], (err, results, fields) => {
    if (err) throw err;
    console.log(results.affectedRows + " record(s) updated");
    res.send(results);
  });
});

// Route: /remove-user => To delete all data from the tables
app.delete("/remove-user", (req, res) => {
  const { id } = req.body;
  let removeName = `DELETE FROM customers WHERE customer_id = ?`;
  let removeAddress = `DELETE FROM address WHERE customer_id = ?`;
  let removeCompany = `DELETE FROM company WHERE customer_id = ?`;

  connection.query(removeAddress, [id], (err, results) => {
    if (err) throw err;
    console.log(results.affectedRows + " record(s) Deleted");
  });

  connection.query(removeCompany, [id], (err, results) => {
    if (err) throw err;
    console.log(results.affectedRows + " record(s) Deleted");
  });

  connection.query(removeName, [id], (err, results) => {
    if (err) throw err;
    console.log(results.affectedRows + " record(s) Deleted");
  });
});
