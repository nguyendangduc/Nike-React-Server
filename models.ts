export interface Address {
    city: string;
    address: string;
  }
  export interface User {
    id: number;
    email: string;
    password: string;
    token: string;
    phoneNumber: string;
    address: Address;
    avatar: string;
    rules: string[];
    expired?:Date;
  }
  export interface UserPostBody {
    id: number;
    email: string;
    password: string;
    token: string;
    phoneNumber: string;
    address: Address;
    avatar: string;
    rules: string[];
  }
  export interface UserPutBody {
    id: number;
    email: string;
    password: string;
    token: string;
    phoneNumber: string;
    address: Address;
    avatar: string;
    rules: string[];
  }
  
  export interface CartItem {
    id: string;
    idUser: string;
    urlImg: string;
    productName: string;
    size: string;
    quantity: number;
    price: number;
  }

  export interface Order {
    id: string;
    idUser: string;
    urlImg: string;
    productName: string;
    size: string;
    quantity: number;
    price: number;
    name:string;
    address:string;
    phoneNumber:string;
  }

   export interface Product {
    id:        number;
    name:      string;
    price:     number;
    color:     number;
    thumbnail: string;
    detailimg: string[];
    colorimg:  string[];
    size:      string[];
    type:      string;
    gender:    string;
  }
  
  export interface ProductPostBody {
    name:      string;
    price:     number;
    color:     number;
    thumbnail: string;
    detailimg: string[];
    colorimg:  string[];
    size:      string[];
    type:      string;
    gender:    string;
  }

  export interface AccountSetting {
    newEmail: string;
    newPassword: string;
  }
  
  export interface ProductPutBody {
    name:      string;
    price:     number;
    color:     number;
    thumbnail: string;
    detailimg: string[];
    colorimg:  string[];
    size:      string[];
    type:      string;
    gender:    string;
  }

  export interface UserRole {
    role: string;
  }
  