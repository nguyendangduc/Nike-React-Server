import express, { Request, Response, NextFunction } from "express";
import bodyParser from "body-parser";
import { readFileSync, writeFileSync } from "fs";
import md5 from "md5";
import { generateId } from "./functions/genId";

interface Address {
  city: string;
  address: string;
}
interface User {
  id: number;
  email: string;
  password: string;
  token: string;
  phoneNumber: number;
  address: Address;
  avatar: string;
  rules: string[];
}

interface Order {
  id: number;
  idUser: number;
  urlImg: string;
  productName: string;
  size: number;
  quantity: number;
  price: number;
}

interface State {
  _id: string;
  id: number;
  abbreviation: string;
  name: string;
}

interface Customer {
  id: number;
  firstName: string;
  lastName: string;
  gender: string;
  address: string;
  city: string;
  state: State;
  orders: Order[];
  latitude: number;
  longitude: number;
}

const app = express();
const customers: Customer[] = JSON.parse(
  readFileSync("data/customers.json", "utf-8")
);
const products: any[] = JSON.parse(readFileSync("data/products.json", "utf-8"));
const states: State[] = JSON.parse(readFileSync("data/states.json", "utf-8"));
const users: User[] = JSON.parse(readFileSync("data/users.json", "utf-8"));
const orders: Order[] = JSON.parse(readFileSync("data/orders.json", "utf-8"));
const port = process.env.PORT || 3005;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Enable CORS
app.use(function (req: Request, res: Response, next: NextFunction) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, Authorization, X-Requested-With, X-XSRF-TOKEN, Content-Type, Accept"
  );
  res.header(
    "Access-Control-Allow-Methods",
    "GET,PUT,POST,DELETE,PATCH,OPTIONS"
  );
  next();
});

function checkToken(request: Request, response: Response, next: NextFunction) {
  const authorization = request.headers.authorization;
  const token = authorization?.split("Bearer ")[1];

  if (!token) {
    console.log('token is required');
    return response.status(401).json({
      message: "token is required",
    });
  }

  const user = users.filter((user) => user.token == token.trim());
  if (!user) {
    console.log('token is invalid')
    return response.status(401).json({
      message: "token is invalid",
    });
  }

  next();
}

// ============================= CUSTOMERS ===========================

app.get("/api/customers/page/:skip/:top", (req: Request, res: Response) => {
  const topVal = parseInt(req.params.top, 10);
  const skipVal = parseInt(req.params.skip, 10);

  const skip = isNaN(skipVal) ? 0 : skipVal;
  let top = isNaN(topVal) ? 10 : skip + topVal;

  if (top > customers.length) {
    top = skip + (customers.length - skip);
  }

  console.log(`Skip: ${skip} Top: ${top}`);

  var pagedCustomers = customers.slice(skip, top);
  res.json({
    results: pagedCustomers,
    totalRecords: customers.length,
  });
});

app.get("/api/customers", (req: Request, res: Response) => {
  res.json(customers);
});

app.get("/api/customers/:id", (req: Request, res: Response) => {
  let customerId = parseInt(req.params.id, 10);
  let selectedCustomer = null;
  for (let customer of customers) {
    if (customer.id === customerId) {
      // found customer to create one to send
      selectedCustomer = {};
      selectedCustomer = customer;
      break;
    }
  }
  res.json(selectedCustomer);
});

app.post("/api/customers", (req: Request, res: Response) => {
  let postedCustomer = req.body;
  let maxId = Math.max.apply(
    Math,
    customers.map((customer) => customer.id)
  );
  postedCustomer.id = ++maxId;
  postedCustomer.gender = postedCustomer.id % 2 === 0 ? "female" : "male";
  customers.push(postedCustomer);
  res.json(postedCustomer);
});

app.put("/api/customers/:id", checkToken, (req: Request, res: Response) => {
  let putCustomer: Customer = req.body;
  let id = parseInt(req.params.id, 10);
  let status = false;

  const customer = customers.find((user) => user.id == id);

  if (!customer) {
    return res.status(400).json({
      message: "Cannot find user with id:" + id,
    });
  }

  customer.firstName = putCustomer.firstName;
  customer.lastName = putCustomer.lastName;
  customer.address = putCustomer.address;
  customer.city = putCustomer.city;

  res.json({ ...customer });
});

app.delete(
  "/api/customers/:id",
  checkToken,
  function (req: Request, res: Response) {
    let customerId = parseInt(req.params.id, 10);
    const findIndex = customers.findIndex((user) => user.id === customerId);

    if (findIndex === -1) {
      return res.status(400).json({
        message: "Cannot find user with id:" + customerId,
      });
    }

    const customer = { ...customers[findIndex] };
    customers.splice(findIndex, 1);

    res.json({ ...customer });
  }
);

// ============================= PRODUCTS ===========================

// get all products
app.get("/api/products", (req: Request, res: Response) => {
  res.json(products);
});

// get detail product
app.get("/api/products/:id", (req: Request, res: Response) => {
  let productId = parseInt(req.params.id, 10);
  let selectedProduct = null;
  for (let product of products) {
    if (product.id === productId) {
      // found product to create one to send
      selectedProduct = {};
      selectedProduct = product;
      break;
    }
  }
  res.json(selectedProduct);
});

// get products by PAGE
app.get("/api/products/page/:skip/:top", (req: Request, res: Response) => {
  // skip: vị trí bắt đầu
  // top: số phần tử 1 page
  const topVal = parseInt(req.params.top, 10);
  const skipVal = parseInt(req.params.skip, 10);

  const skip = isNaN(skipVal) ? 0 : skipVal;
  let top = isNaN(topVal) ? 10 : skip + topVal;

  if (top > products.length) {
    top = skip + (products.length - skip);
  }

  console.log(`Skip: ${skip} Top: ${top}`);

  var pagedProducts = products.slice(skip, top);
  res.json({
    results: pagedProducts,
    totalRecords: products.length,
  });
});

// get products by TYPE
app.get(
  "/api/products/type/:type/page/:skip/:top",
  (req: Request, res: Response) => {
    // skip: vị trí bắt đầu
    // top: số phần tử 1 page
    const productType = req.params.type;
    const topVal = parseInt(req.params.top, 10);
    const skipVal = parseInt(req.params.skip, 10);

    const records = products.filter((product) => product.type === productType);
    const skip = isNaN(skipVal) ? 0 : skipVal;
    let top = isNaN(topVal) ? 10 : skip + topVal;

    if (top > records.length) {
      top = skip + (records.length - skip);
    }

    console.log(`Skip: ${skip} Top: ${top} type: ${productType}`);

    var pagedProducts = records.slice(skip, top);
    res.json({
      results: pagedProducts,
      totalRecords: records.length,
    });
  }
);

// get products by SEARCH
app.get(
  "/api/products/search/:search/page/:skip/:top",
  (req: Request, res: Response) => {
    const searchW = req.params.search;
    const topVal = parseInt(req.params.top, 10);
    const skipVal = parseInt(req.params.skip, 10);

    const skip = isNaN(skipVal) ? 0 : skipVal;
    let top = isNaN(topVal) ? 10 : skip + topVal;

    let records = products.filter(
      (product) =>
        product.name.toLowerCase().includes(searchW.toLowerCase()) === true
    );

    if (top > records.length) {
      top = skip + (records.length - skip);
    }

    console.log(`Skip: ${skip} Top: ${top}  search: ${searchW}`);

    var pagedProducts = records.slice(skip, top);
    res.json({
      results: pagedProducts,
      totalRecords: records.length,
    });
  }
);

// get products by SORT
app.get(
  "/api/products/sort/:sortBy/:sortVal/page/:skip/:top",
  (req: Request, res: Response) => {
    const sortBy = req.params.sortBy;
    const sortVal = req.params.sortVal;
    const topVal = parseInt(req.params.top, 10);
    const skipVal = parseInt(req.params.skip, 10);

    const skip = isNaN(skipVal) ? 0 : skipVal;
    let top = isNaN(topVal) ? 10 : skip + topVal;

    let records = [...products];

    if (sortBy === "price") {
      if (sortVal === "asc") {
        // tang dan
        records.sort((a, b) => Number(a.price) - Number(b.price));
      } else if (sortVal === "desc") {
        // giam dan
        records.sort((a, b) => Number(b.price) - Number(a.price));
      }
    }

    if (top > records.length) {
      top = skip + (records.length - skip);
    }

    console.log(
      `Skip: ${skip} Top: ${top} sortBy: ${sortBy} sortVal: ${sortVal}`
    );

    var pagedProducts = records.slice(skip, top);
    res.json({
      results: pagedProducts,
      totalRecords: records.length,
    });
  }
);

// get products by TYPE & SORT
app.get(
  "/api/products/type/:type/sort/:sortBy/:sortVal/page/:skip/:top",
  (req: Request, res: Response) => {
    const productType = req.params.type;
    const sortBy = req.params.sortBy;
    const sortVal = req.params.sortVal;
    const topVal = parseInt(req.params.top, 10);
    const skipVal = parseInt(req.params.skip, 10);

    const skip = isNaN(skipVal) ? 0 : skipVal;
    let top = isNaN(topVal) ? 10 : skip + topVal;

    let records = products.filter((product) => product.type === productType);
    records = [...records];
    if (sortBy === "price") {
      if (sortVal === "asc") {
        // tang dan
        records.sort((a, b) => Number(a.price) - Number(b.price));
      } else if (sortVal === "desc") {
        // giam dan
        records.sort((a, b) => Number(b.price) - Number(a.price));
      }
    }

    if (top > records.length) {
      top = skip + (records.length - skip);
    }

    console.log(
      `Skip: ${skip} Top: ${top} type: ${productType} sortBy: ${sortBy} sortVal: ${sortVal}`
    );

    var pagedProducts = records.slice(skip, top);
    res.json({
      results: pagedProducts,
      totalRecords: records.length,
    });
  }
);

// get products by TYPE & SEARCH
app.get(
  "/api/products/type/:type/search/:search/page/:skip/:top",
  (req: Request, res: Response) => {
    const productType = req.params.type;
    const searchW = req.params.search;
    const topVal = parseInt(req.params.top, 10);
    const skipVal = parseInt(req.params.skip, 10);

    const skip = isNaN(skipVal) ? 0 : skipVal;
    let top = isNaN(topVal) ? 10 : skip + topVal;

    let records = products.filter(
      (product) =>
        product.type === productType &&
        product.name.toLowerCase().includes(searchW.toLowerCase()) === true
    );

    if (top > records.length) {
      top = skip + (records.length - skip);
    }

    console.log(
      `Skip: ${skip} Top: ${top} type: ${productType} search: ${searchW}`
    );

    var pagedProducts = records.slice(skip, top);
    res.json({
      results: pagedProducts,
      totalRecords: records.length,
    });
  }
);

// get products by SEARCH & SORT
app.get(
  "/api/products/search/:search/sort/:sortBy/:sortVal/page/:skip/:top",
  (req: Request, res: Response) => {
    const searchW = req.params.search;
    const sortBy = req.params.sortBy;
    const sortVal = req.params.sortVal;
    const topVal = parseInt(req.params.top, 10);
    const skipVal = parseInt(req.params.skip, 10);

    const skip = isNaN(skipVal) ? 0 : skipVal;
    let top = isNaN(topVal) ? 10 : skip + topVal;

    let records = products.filter(
      (product) =>
        product.name.toLowerCase().includes(searchW.toLowerCase()) === true
    );

    records = [...records];
    if (sortBy === "price") {
      if (sortVal === "asc") {
        // tang dan
        records.sort((a, b) => Number(a.price) - Number(b.price));
      } else if (sortVal === "desc") {
        // giam dan
        records.sort((a, b) => Number(b.price) - Number(a.price));
      }
    }

    if (top > records.length) {
      top = skip + (records.length - skip);
    }

    console.log(
      `Skip: ${skip} Top: ${top} search: ${searchW} sortBy: ${sortBy} sortVal: ${sortVal}`
    );

    var pagedProducts = records.slice(skip, top);
    res.json({
      results: pagedProducts,
      totalRecords: records.length,
    });
  }
);

// get products by TYPE & SEARCH & SORT
app.get(
  "/api/products/type/:type/search/:search/sort/:sortBy/:sortVal/page/:skip/:top",
  (req: Request, res: Response) => {
    const productType = req.params.type;
    const searchW = req.params.search;
    const sortBy = req.params.sortBy;
    const sortVal = req.params.sortVal;
    const topVal = parseInt(req.params.top, 10);
    const skipVal = parseInt(req.params.skip, 10);

    const skip = isNaN(skipVal) ? 0 : skipVal;
    let top = isNaN(topVal) ? 10 : skip + topVal;

    let records = products.filter(
      (product) =>
        product.type === productType &&
        product.name.toLowerCase().includes(searchW.toLowerCase()) === true
    );

    records = [...records];
    if (sortBy === "price") {
      if (sortVal === "asc") {
        // tang dan
        records.sort((a, b) => Number(a.price) - Number(b.price));
      } else if (sortVal === "desc") {
        // giam dan
        records.sort((a, b) => Number(b.price) - Number(a.price));
      }
    }

    if (top > records.length) {
      top = skip + (records.length - skip);
    }

    console.log(
      `Skip: ${skip} Top: ${top} type: ${productType} search: ${searchW} sortBy: ${sortBy} sortVal: ${sortVal}`
    );

    var pagedProducts = records.slice(skip, top);
    res.json({
      results: pagedProducts,
      totalRecords: records.length,
    });
  }
);

// ============================= ORDERS ===========================

app.get("/api/orders/:id", function (req: Request, res: Response) {
  let userId = parseInt(req.params.id, 10);
  let ords: Order[] = [];
  for (let ord of orders) {
    if (ord.idUser === userId) {
      ords.push(ord);
    }
  }

  res.json(ords);
});

// ============================= STATES ===========================

app.get("/api/states", (req: Request, res: Response) => {
  res.json(states);
});

app.post("/api/users", checkToken, (req: Request, res: Response) => {
  var { currentEmail, newEmail, password, numberPerPage } = req.body;

  console.log(currentEmail, newEmail, password, numberPerPage);

  const user = users.find(
    (user) => user.email === currentEmail && user.password === password
  );

  if (!user) {
    return res.status(400).json({
      message: "Email or password is invalid",
    });
  }

  user.email = newEmail;

  res.json({
    ...user,
  });
});

// ============================= AUTH ===========================

app.post("/api/auth/login", (req: Request, res: Response) => {
  var { email, password } = req.body;

  const user = users.find(
    (user) => user.email === email && user.password === password
  );

  if (!user) {
    return res.status(400).json({ message: "Email or password is invalid" });
  }

  user.token = md5(new Date().getTime().toString());
  return res.json({ ...user });
});

app.post(
  "/api/auth/authWithToken",
  checkToken,
  (req: Request, res: Response) => {
    const authorization = req.headers.authorization;
    const token = authorization?.split("Bearer ")[1];
    const user = users.find((user) => {
      return user.token==token?.trim()
    })
    if (!user) {
      return res.status(401).json({ message: "Token is invalid" });
    }

    return res.json({ ...user });
  }
);

app.post("/api/auth/register", (req: Request, res: Response) => {
  var { email, password } = req.body;

  const user = users.find((user) => user.email === email);
  if (user) {
    return res.status(400).json({ message: "This email already exists!" });
  } else if (!user) {
    users.push({
      id: generateId(),
      email: email,
      password: password,
      token: md5(new Date().getTime().toString()),
      phoneNumber: 0,
      avatar: "",
      address: { address: "", city: "" },
      rules:["user"]
    });
    const userRes = users.find(
      (user) => user.email === email && user.password === password
    );
    return res.json({ ...userRes });
  }
});

app.post("/api/auth/logout", checkToken, (req: Request, res: Response) => {
  res.json(true);
});

// ============================= USERS ===========================

app.get("/api/users/page/:skip/:top", (req: Request, res: Response) => {
  const topVal = parseInt(req.params.top, 10);
  const skipVal = parseInt(req.params.skip, 10);

  const skip = isNaN(skipVal) ? 0 : skipVal;
  let top = isNaN(topVal) ? 10 : skip + topVal;

  if (top > users.length) {
    top = skip + (users.length - skip);
  }

  console.log(`Skip: ${skip} Top: ${top}`);

  var pagedUsers = users.slice(skip, top);
  res.json({
    results: pagedUsers,
    totalRecords: users.length,
  });
});

app.get("/api/users", (req: Request, res: Response) => {
  res.json(users);
});

app.get("/api/users/:id", (req: Request, res: Response) => {
  let userId = parseInt(req.params.id, 10);
  let selectedUser = null;
  for (let user of users) {
    if (user.id === userId) {
      // found user to create one to send
      selectedUser = {};
      selectedUser = user;
      break;
    }
  }
  res.json(selectedUser);
});

app.post("/api/users",checkToken, (req: Request, res: Response) => {
  let postedUser = req.body;
  let maxId = Math.max.apply(
    Math,
    users.map((user) => user.id)
  );
  postedUser.id = ++maxId;
  users.push(postedUser);
  res.json(postedUser);
});

app.put("/api/users/:id", checkToken, (req: Request, res: Response) => {
  let putUser: User = req.body;
  let id = parseInt(req.params.id, 10);
  let status = false;

  const user = users.find((user) => user.id == id);

  if (!user) {
    return res.status(400).json({
      message: "Cannot find user with id:" + id,
    });
  }

  user.password = putUser.password;
  user.address = putUser.address;
  user.avatar = putUser.avatar;
  user.phoneNumber = putUser.phoneNumber;
  user.rules = putUser.rules;

  res.json({ ...user });
});

app.delete(
  "/api/users/:id",
  checkToken,
  function (req: Request, res: Response) {
    let userId = parseInt(req.params.id, 10);
    const findIndex = users.findIndex((user) => user.id === userId);

    if (findIndex === -1) {
      return res.status(400).json({
        message: "Cannot find user with id:" + userId,
      });
    }

    const user = { ...users[findIndex] };
    users.splice(findIndex, 1);

    res.json({ ...user });
  }
);
// ============================= RUN ===========================

app.listen(port);

console.log("Express listening on port " + port);
