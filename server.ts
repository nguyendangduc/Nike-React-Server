import express, { Request, Response, NextFunction } from "express";
import bodyParser from "body-parser";
import { readFileSync, writeFileSync } from "fs";
import md5 from "md5";
import { generateId, genId } from "./functions/genId";
import {Product, User, Order, ProductPutBody, ProductPostBody, UserPostBody, UserPutBody} from './models'

const app = express();
const products: Product[] = JSON.parse(readFileSync("data/products.json", "utf-8"));
const users: User[] = JSON.parse(readFileSync("data/users.json", "utf-8"));
const orders: Order[] = JSON.parse(readFileSync("data/orders.json", "utf-8"));
const carts : Order[] = JSON.parse(readFileSync("data/carts.json", "utf-8"));
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
    console.log("token is required");
    return response.status(401).json({
      message: "token is required",
    });
  }

  const user = users.filter((user) => user.token == token.trim())[0];
  if (!user) {
    console.log("token is invalid");
    return response.status(401).json({
      message: "token is invalid",
    });
  }

  next();
}

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

function checkPermission(req:Request, rule:string) {

  const authorization = req.headers.authorization;
  const token = authorization?.split("Bearer ")[1];
  const user = users.find((user) => {
    return user.token == token?.trim();
  });
  return user?.rules.includes(rule) ? true : false;
}


app.post("/api/products", checkToken, (req: Request, res: Response) => {

  if (!checkPermission(req, 'admin')) {
    return res.status(403).json({ message: "Access denied" });
  }

  let postedProduct:ProductPostBody = req.body
  let maxId = Math.max.apply(
    Math,
    products.map((product) => product.id)
  );
  const newProduct:Product = {...postedProduct,id:++maxId};
  products.push(newProduct);
  res.json(newProduct);

});

app.put("/api/products/:id", checkToken, (req: Request, res: Response) => {

  if (!checkPermission(req, 'admin')) {
    return res.status(403).json({ message: "Access denied" });
  }

  let putProduct:ProductPutBody = req.body;
  let id = parseInt(req.params.id, 10);

  const product:Product|undefined = products.find((product) => product.id == id);

  if (!product) {
    return res.status(400).json({
      nameInput:'id',
      message: "Cannot find product with id:" + id,
    });
  }

    product.name = putProduct.name;
    product.price = putProduct.price;
    product.size = putProduct.size;
    product.thumbnail = putProduct.thumbnail;
    product.type = putProduct.type;
    product.color = putProduct.color;
    product.colorimg = putProduct.colorimg;
    product.detailimg = putProduct.detailimg;

    res.json({ ...product });
  }
)

app.delete(
  "/api/products/:id",
  checkToken,
  function (req: Request, res: Response) {

    if (!checkPermission(req, 'admin')) {
      return res.status(403).json({ message: "Access denied" });
    }

    let productId = parseInt(req.params.id, 10);
    const findIndex = products.findIndex((product) => product.id === productId);

    if (findIndex === -1) {
      return res.status(400).json({
        message: "Cannot find product with id:" + productId,
      });
    }

    const product = { ...products[findIndex] };
    products.splice(findIndex, 1);

    res.json({ ...product });
  }
);

// ============================= ORDERS ===========================

app.get("/api/orders/:id",checkToken, function (req: Request, res: Response) {
  let userId = req.params.id;
  let ords: Order[] = [];
  for (let ord of orders) {
    if (ord.idUser === userId) {
      ords.push(ord);
    }
  }
  res.json(ords);
});

// ============================= CARTs ===========================

app.get("/api/carts/:id", checkToken, (req: Request, res: Response)=>{
  let userId = req.params.id;
  let c: Order[] = [];
  for (let ca of carts){
    if(ca.idUser === userId){
      c.push(ca);
    }
  }
  res.json(c);
});

app.post("/api/carts/:id", checkToken, (req: Request, res: Response)=>{
  let userId = req.params.id;
  let ca = req.body;
  let c: Order[] = [];
  // let maxId = Math.max.apply(
  //   Math,
  //   carts.map((cart) => cart.id)
  // );
  for (let car of carts){
    if(car.idUser === userId){
      c.push(car);
    }
  }
  ca.id = genId();
  ca.idUser = userId;
  carts.push(ca);
  res.json({...ca});
})

app.delete("/api/carts/:id/:idOrder", checkToken, (req: Request, res: Response)=>{
  let userId = req.params.id;
  let orderId = req.params.idOrder;
  const findIndex = carts.findIndex((order) => (order.id === orderId && order.idUser === userId));

    if (findIndex === -1) {
      return res.status(400).json({
        message: "Cannot find order with id:" + userId,
      });
    }

    const cart = { ...carts[findIndex] };
    carts.splice(findIndex, 1);

    res.json({...cart });
})


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
      return user.token == token?.trim();
    });
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
      phoneNumber: "",
      avatar: "",
      address: { address: "", city: "" },
      rules: ["user"],
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

app.get("/api/users/page/:skip/:top", checkToken, (req: Request, res: Response) => {

  if (!checkPermission(req, 'admin')) {
    return res.status(403).json({ message: "Access denied" });
  }

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

app.get(
  "/api/users/search/:search/page/:skip/:top", checkToken,
  (req: Request, res: Response) => {

    if (!checkPermission(req, 'admin')) {
      return res.status(403).json({ message: "Access denied" });
    }

    const searchW = req.params.search;
    const topVal = parseInt(req.params.top, 10);
    const skipVal = parseInt(req.params.skip, 10);

    const skip = isNaN(skipVal) ? 0 : skipVal;
    let top = isNaN(topVal) ? 10 : skip + topVal;

    let records = users.filter(
      (user) =>
        user.email.toLowerCase().includes(searchW.toLowerCase()) === true
    );

    if (top > records.length) {
      top = skip + (records.length - skip);
    }

    console.log(`Skip: ${skip} Top: ${top}  search: ${searchW}`);

    var pagedUsers = records.slice(skip, top);
    res.json({
      results: pagedUsers,
      totalRecords: records.length,
    });
  }
);

app.get("/api/users",checkToken, (req: Request, res: Response) => {
  
  if (!checkPermission(req, 'admin')) {
    return res.status(403).json({ message: "Access denied" });
  }

  res.json(users);
});

app.get("/api/users/:id", checkToken, (req: Request, res: Response) => {

  if (!checkPermission(req, 'admin')) {
    return res.status(403).json({ message: "Access denied" });
  }

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

app.post("/api/users", checkToken, (req: Request, res: Response) => {

  if (!checkPermission(req, 'admin')) {
    return res.status(403).json({ message: "Access denied" });
  }

  let postedUser:User = req.body;
  const findUserByEmail = users.find((user) => user.email === postedUser.email);
  if (findUserByEmail) {
    return res.status(400).json({
      message: "This email already exits!",
    });
  }
  let maxId = Math.max.apply(
    Math,
    users.map((user) => user.id)
  );
  postedUser.id = ++maxId;
  postedUser.rules = ['user']
  users.push(postedUser);
  res.json(postedUser);

});

app.put("/api/users/:id", checkToken, (req: Request, res: Response) => {

  // if (!checkPermission(req, 'admin')) {
  //   return res.status(403).json({ message: "Access denied" });
  // }

  let putUser: User = req.body;
  let id = parseInt(req.params.id, 10);
  let status = false;

  const user = users.find((user) => user.id == id);

  if (!user) {
    return res.status(400).json({
      nameInput:'id',
      message: "Cannot find user with id:" + id,
    });
  }

  if (putUser.password === user.password) {
    const userFindByEmail = users.find((user) => user.email === putUser.email);
    if (userFindByEmail && userFindByEmail.id !== id) {
      return res.status(400).json({ nameInput:"email",message: "New Email is already exists!" });
    }
    user.email = putUser.email;
    user.password = putUser.password;
    user.address = putUser.address;
    user.avatar = putUser.avatar;
    user.phoneNumber = putUser.phoneNumber;

    res.json({ ...user });
  }
  return res.status(400).json({ nameInput:"password", message: "Confirm password is incorrect!" });

});

app.delete(
  "/api/users/:id",
  checkToken,
  function (req: Request, res: Response) {

    if (!checkPermission(req, 'admin')) {
      return res.status(403).json({ message: "Access denied" });
    }
    
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
