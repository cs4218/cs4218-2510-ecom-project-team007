# CS4218 Project - Virtual Vault

## 1. Project Introduction

Virtual Vault is a full-stack MERN (MongoDB, Express.js, React.js, Node.js) e-commerce website, offering seamless connectivity and user-friendly features. The platform provides a robust framework for online shopping. The website is designed to adapt to evolving business needs and can be efficiently extended.

## 2. Website Features

- **User Authentication**: Secure user authentication system implemented to manage user accounts and sessions.
- **Payment Gateway Integration**: Seamless integration with popular payment gateways for secure and reliable online transactions.
- **Search and Filters**: Advanced search functionality and filters to help users easily find products based on their preferences.
- **Product Set**: Organized product sets for efficient navigation and browsing through various categories and collections.

## 3. Your Task

- **Unit and Integration Testing**: Utilize Jest for writing and running tests to ensure individual components and functions work as expected, finding and fixing bugs in the process.
- **UI Testing**: Utilize Playwright for UI testing to validate the behavior and appearance of the website's user interface.
- **Code Analysis and Coverage**: Utilize SonarQube for static code analysis and coverage reports to maintain code quality and identify potential issues.
- **Load Testing**: Leverage JMeter for load testing to assess the performance and scalability of the ecommerce platform under various traffic conditions.

## 4. Setting Up The Project

### 1. Installing Node.js

1. **Download and Install Node.js**:

   - Visit [nodejs.org](https://nodejs.org) to download and install Node.js.

2. **Verify Installation**:
   - Open your terminal and check the installed versions of Node.js and npm:
     ```bash
     node -v
     npm -v
     ```

### 2. MongoDB Setup

1. **Download and Install MongoDB Compass**:

   - Visit [MongoDB Compass](https://www.mongodb.com/products/tools/compass) and download and install MongoDB Compass for your operating system.

2. **Create a New Cluster**:

   - Sign up or log in to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register).
   - After logging in, create a project and within that project deploy a free cluster.

3. **Configure Database Access**:

   - Create a new user for your database (if not alredy done so) in MongoDB Atlas.
   - Navigate to "Database Access" under "Security" and create a new user with the appropriate permissions.

4. **Whitelist IP Address**:

   - Go to "Network Access" under "Security" and whitelist your IP address to allow access from your machine.
   - For example, you could whitelist 0.0.0.0 to allow access from anywhere for ease of use.

5. **Connect to the Database**:

   - In your cluster's page on MongoDB Atlas, click on "Connect" and choose "Compass".
   - Copy the connection string.

6. **Establish Connection with MongoDB Compass**:
   - Open MongoDB Compass on your local machine, paste the connection string (replace the necessary placeholders), and establish a connection to your cluster.

### 3. Application Setup

To download and use the MERN (MongoDB, Express.js, React.js, Node.js) app from GitHub, follow these general steps:

1. **Clone the Repository**

   - Go to the GitHub repository of the MERN app.
   - Click on the "Code" button and copy the URL of the repository.
   - Open your terminal or command prompt.
   - Use the `git clone` command followed by the repository URL to clone the repository to your local machine:
     ```bash
     git clone <repository_url>
     ```
   - Navigate into the cloned directory.

2. **Install Frontend and Backend Dependencies**

   - Run the following command in your project's root directory:

     ```
     npm install && cd client && npm install && cd ..
     ```

3. **Add database connection string to `.env`**

   - Add the connection string copied from MongoDB Atlas to the `.env` file inside the project directory (replace the necessary placeholders):
     ```env
     MONGO_URL = <connection string>
     ```

4. **Adding sample data to database**

   - Download “Sample DB Schema” from Canvas and extract it.
   - In MongoDB Compass, create a database named `test` under your cluster.
   - Add four collections to this database: `categories`, `orders`, `products`, and `users`.
   - Under each collection, click "ADD DATA" and import the respective JSON from the extracted "Sample DB Schema".

5. **Running the Application**
   - Open your web browser.
   - Use `npm run dev` to run the app from root directory, which starts the development server.
   - Navigate to `http://localhost:3000` to access the application.

## 5. Unit Testing with Jest

Unit testing is a crucial aspect of software development aimed at verifying the functionality of individual units or components of a software application. It involves isolating these units and subjecting them to various test scenarios to ensure their correctness.  
Jest is a popular JavaScript testing framework widely used for unit testing. It offers a simple and efficient way to write and execute tests in JavaScript projects.

### Getting Started with Jest

To begin unit testing with Jest in your project, follow these steps:

1. **Install Jest**:  
   Use your preferred package manager to install Jest. For instance, with npm:

   ```bash
   npm install --save-dev jest

   ```

2. **Write Tests**  
   Create test files for your components or units where you define test cases to evaluate their behaviour.

3. **Run Tests**  
   Execute your tests using Jest to ensure that your components meet the expected behaviour.  
   You can run the tests by using the following command in the root of the directory:

   - **Frontend tests**

     ```bash
     npm run test:frontend
     ```

   - **Backend tests**

     ```bash
     npm run test:backend
     ```

   - **All the tests**
     ```bash
     npm run test
     ```

## Milestone 1

### 1. Continuous Integration

View our GitHub Actions workflow run [here](https://github.com/cs4218/cs4218-2510-ecom-project-team007/actions/runs/18263590932/job/51994825115).

### 2. Contributions

<table>
  <thead>
    <tr>
      <th>Name</th>
      <th>Features</th>
      <th>Client Related Files (<code>/client/src/</code>)</th>
      <th>Server Related Files (<code>./</code>)</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td rowspan="4">Benjamin (<a href="https://github.com/benjiBase">@benjiBase</a>)</td>
      <td>Protected Routes</td>
      <td>- <code>context/auth.js</code></td>
      <td>
        - <code>helpers/authHelper.js</code><br />
        - <code>middlewares/authMiddleware.js</code>
      </td>
    </tr>
    <tr>
      <td>Registration</td>
      <td>- <code>pages/Auth/Register.js</code></td>
      <td rowspan="2">
        - <code>controllers/authController.js</code><br />
        &nbsp;&nbsp;1. <code>registerController</code><br />
        &nbsp;&nbsp;2. <code>loginController</code><br />
        &nbsp;&nbsp;3. <code>forgotPasswordController</code><br />
        &nbsp;&nbsp;4. <code>testController</code>
      </td>
    </tr>
    <tr>
      <td>Login</td>
      <td>- <code>pages/Auth/Login.js</code></td>
    </tr>
    <tr>
      <td>General</td>
      <td>
        - <code>components/Routes/Private.js</code><br />
        - <code>components/UserMenu.js</code><br />
        - <code>pages/user/Dashboard.js</code>
      </td>
      <td>- <code>models/userModel.js</code></td>
    </tr>
    <tr>
      <td rowspan="4">Clement (<a href="https://github.com/Gra7ityIC3">@Gra7ityIC3</a>)</td>
      <td>Admin Dashboard</td>
      <td>
        - <code>components/AdminMenu.js</code><br />
        - <code>pages/admin/AdminDashboard.js</code>
      </td>
      <td></td>
    </tr>
    <tr>
      <td>Admin Actions</td>
      <td>
        - <code>components/Form/CategoryForm.js</code><br />
        - <code>pages/admin/CreateCategory.js</code><br />
        - <code>pages/admin/CreateProduct.js</code><br />
        - <code>pages/admin/UpdateProduct.js</code>
      </td>
      <td>
        - <code>controllers/categoryController.js</code><br />
        &nbsp;&nbsp;1. <code>createCategoryController</code><br />
        &nbsp;&nbsp;2. <code>updateCategoryController</code><br />
        &nbsp;&nbsp;3. <code>deleteCategoryController</code>
      </td>
    </tr>
    <tr>
      <td>Admin View Orders</td>
      <td>- <code>pages/admin/AdminOrders.js</code></td>
      <td></td>
    </tr>
    <tr>
      <td>Admin View Products</td>
      <td>- <code>pages/admin/Products.js</code></td>
      <td>
        - <code>controllers/productController.js</code><br />
        &nbsp;&nbsp;1. <code>createProductController</code><br />
        &nbsp;&nbsp;2. <code>updateProductController</code><br />
        &nbsp;&nbsp;3. <code>deleteProductController</code>
      </td>
    </tr>
    <tr>
      <td rowspan="5">Wei Nian (<a href="https://github.com/hweinian">@hweinian</a>)</td>
      <td>Order</td>
      <td>- <code>pages/user/Orders.js</code></td>
      <td>
        - <code>controllers/authController.js</code><br />
        &nbsp;&nbsp;1. <code>updateProfileController</code><br />
        &nbsp;&nbsp;2. <code>getOrdersController</code><br />
        &nbsp;&nbsp;3. <code>getAllOrdersController</code><br />
        &nbsp;&nbsp;4. <code>orderStatusController</code><br />
        - <code>models/orderModel.js</code>
      </td>
    </tr>
    <tr>
      <td>Payment</td>
      <td></td>
      <td>
        - <code>controllers/productController.js</code><br />
        &nbsp;&nbsp;1. <code>braintreeTokenController</code><br />
        &nbsp;&nbsp;2. <code>brainTreePaymentController</code>
      </td>
    </tr>
    <tr>
      <td>Cart</td>
      <td>
        - <code>context/cart.js</code><br />
        - <code>pages/CartPage.js</code>
      </td>
      <td></td>
    </tr>
    <tr>
      <td>Search</td>
      <td>
        - <code>components/Form/SearchInput.js</code><br />
        - <code>context/search.js</code><br />
        - <code>pages/Search.js</code>
      </td>
      <td></td>
    </tr>
    <tr>
      <td>Home</td>
      <td>- <code>pages/Homepage.js</code></td>
      <td></td>
    </tr>
    <tr>
      <td rowspan="3">Chan How (<a href="https://github.com/ChillinRage">@ChillinRage</a>)</td>
      <td>Product</td>
      <td>
        - <code>pages/ProductDetails.js</code><br />
        - <code>pages/CategoryProduct.js</code>
      </td>
      <td>
        - <code>controllers/productController.js</code><br />
        &nbsp;&nbsp;1. <code>getProductController</code><br />
        &nbsp;&nbsp;2. <code>getSingleProductController</code><br />
        &nbsp;&nbsp;3. <code>productPhotoController</code><br />
        &nbsp;&nbsp;4. <code>productFiltersController</code><br />
        &nbsp;&nbsp;5. <code>productCountController</code><br />
        &nbsp;&nbsp;6. <code>productListController</code><br />
        &nbsp;&nbsp;7. <code>searchProductController</code><br />
        &nbsp;&nbsp;8. <code>relatedProductController</code><br />
        &nbsp;&nbsp;9. <code>productCategoryController</code><br />
        - <code>models/productModel.js</code>
      </td>
    </tr>
    <tr>
      <td>Contact</td>
      <td>- <code>pages/Contact.js</code></td>
      <td></td>
    </tr>
    <tr>
      <td>Policy</td>
      <td>- <code>pages/Policy.js</code></td>
      <td></td>
    </tr>
    <tr>
      <td rowspan="4">Yun Ru (<a href="https://github.com/yunruu">@yunruu</a>)</td>
      <td>General</td>
      <td>
        - <code>components/Footer.js</code><br />
        - <code>components/Header.js</code><br />
        - <code>components/Layout.js</code><br />
        - <code>components/Spinner.js</code><br />
        - <code>pages/About.js</code><br />
        - <code>pages/Pagenotfound.js</code>
      </td>
      <td>- <code>config/db.js</code></td>
    </tr>
    <tr>
      <td>Profile</td>
      <td>- <code>pages/user/Profile.js</code></td>
      <td></td>
    </tr>
    <tr>
      <td>Category</td>
      <td>
        - <code>hooks/useCategory.js</code><br />
        - <code>pages/Categories.js</code>
      </td>
      <td>
        - <code>controllers/categoryController.js</code><br />
        &nbsp;&nbsp;1. <code>categoryController</code><br />
        &nbsp;&nbsp;2. <code>singleCategoryController</code><br />
        - <code>models/categoryModel.js</code>
      </td>
    </tr>
    <tr>
      <td>Admin View Users</td>
      <td>- <code>pages/admin/Users.js</code></td>
      <td></td>
    </tr>
  </tbody>
</table>


## Milestone 2

### Integration Test Contributions

<table>
  <thead>
    <tr>
      <th>Name</th>
      <th>Features</th>
      <th>Client Related Files (<code>/client/src/</code>)</th>
      <th>Server Related Files (<code>./</code>)</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td rowspan="4">Benjamin (<a href="https://github.com/benjiBase">@benjiBase</a>)</td>
      <td>Protected Routes</td>
      <td>- <code>context/auth.js</code></td>
      <td>
        - <code>helpers/authHelper.js</code><br />
        - <code>middlewares/authMiddleware.js</code>
      </td>
    </tr>
    <tr>
      <td>Registration</td>
      <td>- <code>pages/Auth/Register.js</code></td>
      <td rowspan="2">
        - <code>controllers/authController.js</code><br />
        &nbsp;&nbsp;1. <code>registerController</code><br />
        &nbsp;&nbsp;2. <code>loginController</code><br />
        &nbsp;&nbsp;3. <code>forgotPasswordController</code><br />
        &nbsp;&nbsp;4. <code>testController</code>
      </td>
    </tr>
    <tr>
      <td>Login</td>
      <td>- <code>pages/Auth/Login.js</code></td>
    </tr>
    <tr>
      <td>General</td>
      <td>
        - <code>components/Routes/Private.js</code><br />
        - <code>components/UserMenu.js</code><br />
        - <code>pages/user/Dashboard.js</code>
      </td>
      <td>- <code>models/userModel.js</code></td>
    </tr>
    <tr>
      <td rowspan="4">Clement (<a href="https://github.com/Gra7ityIC3">@Gra7ityIC3</a>)</td>
      <td>Admin Dashboard</td>
      <td>
        - <code>components/AdminMenu.js</code><br />
        - <code>pages/admin/AdminDashboard.js</code>
      </td>
      <td></td>
    </tr>
    <tr>
      <td>Admin Actions</td>
      <td>
        - <code>components/Form/CategoryForm.js</code><br />
        - <code>pages/admin/CreateCategory.js</code><br />
        - <code>pages/admin/CreateProduct.js</code><br />
        - <code>pages/admin/UpdateProduct.js</code>
      </td>
      <td>
        - <code>controllers/categoryController.js</code><br />
        &nbsp;&nbsp;1. <code>createCategoryController</code><br />
        &nbsp;&nbsp;2. <code>updateCategoryController</code><br />
        &nbsp;&nbsp;3. <code>deleteCategoryController</code>
      </td>
    </tr>
    <tr>
      <td>Admin View Orders</td>
      <td>- <code>pages/admin/AdminOrders.js</code></td>
      <td></td>
    </tr>
    <tr>
      <td>Admin View Products</td>
      <td>- <code>pages/admin/Products.js</code></td>
      <td>
        - <code>controllers/productController.js</code><br />
        &nbsp;&nbsp;1. <code>createProductController</code><br />
        &nbsp;&nbsp;2. <code>updateProductController</code><br />
        &nbsp;&nbsp;3. <code>deleteProductController</code>
      </td>
    </tr>
    <tr>
      <td rowspan="5">Wei Nian (<a href="https://github.com/hweinian">@hweinian</a>)</td>
      <td>Order</td>
      <td>- <code>pages/user/Orders.js</code></td>
      <td>
        - <code>controllers/authController.js</code><br />
        &nbsp;&nbsp;1. <code>updateProfileController</code><br />
        &nbsp;&nbsp;2. <code>getOrdersController</code><br />
        &nbsp;&nbsp;3. <code>getAllOrdersController</code><br />
        &nbsp;&nbsp;4. <code>orderStatusController</code><br />
        - <code>models/orderModel.js</code>
      </td>
    </tr>
    <tr>
      <td>Payment</td>
      <td></td>
      <td>
        - <code>controllers/productController.js</code><br />
        &nbsp;&nbsp;1. <code>braintreeTokenController</code><br />
        &nbsp;&nbsp;2. <code>brainTreePaymentController</code>
      </td>
    </tr>
    <tr>
      <td>Cart</td>
      <td>
        - <code>context/cart.js</code><br />
        - <code>pages/CartPage.js</code>
      </td>
      <td></td>
    </tr>
    <tr>
      <td>Search</td>
      <td>
        - <code>components/Form/SearchInput.js</code><br />
        - <code>context/search.js</code><br />
        - <code>pages/Search.js</code>
      </td>
      <td></td>
    </tr>
    <tr>
      <td>Home</td>
      <td>- <code>pages/Homepage.js</code></td>
      <td></td>
    </tr>
    <tr>
      <td rowspan="3">Chan How (<a href="https://github.com/ChillinRage">@ChillinRage</a>)</td>
      <td>Category Product Page</td>
      <td></td>
      <td>
        - <code>controllers/productController.js</code><br />
        &nbsp;&nbsp;1. <code>getProductController</code><br />
        &nbsp;&nbsp;2. <code>getSingleProductController</code><br />
        &nbsp;&nbsp;3. <code>productPhotoController</code><br />
        &nbsp;&nbsp;4. <code>productFiltersController</code><br />
        &nbsp;&nbsp;5. <code>productCountController</code><br />
        &nbsp;&nbsp;6. <code>productListController</code><br />
        &nbsp;&nbsp;9. <code>productCategoryController</code><br />
        - <code>routes/productRoutes.js</code><br />
      </td>
    </tr>
    <tr>
      <td>Contact</td>
      <td>- <code>pages/Contact.js</code></td>
      <td></td>
    </tr>
    <tr>
      <td>Policy</td>
      <td>- <code>pages/Policy.js</code></td>
      <td></td>
    </tr>
    <tr>
      <td rowspan="4">Yun Ru (<a href="https://github.com/yunruu">@yunruu</a>)</td>
      <td>General</td>
      <td>
        - <code>components/Footer.js</code><br />
        - <code>components/Header.js</code><br />
        - <code>components/Layout.js</code><br />
        - <code>components/Spinner.js</code><br />
        - <code>pages/About.js</code><br />
        - <code>pages/Pagenotfound.js</code>
      </td>
      <td>- <code>config/db.js</code></td>
    </tr>
    <tr>
      <td>Profile</td>
      <td>- <code>pages/user/Profile.js</code></td>
      <td></td>
    </tr>
    <tr>
      <td>Category</td>
      <td>
        - <code>hooks/useCategory.js</code><br />
        - <code>pages/Categories.js</code>
      </td>
      <td>
        - <code>controllers/categoryController.js</code><br />
        &nbsp;&nbsp;1. <code>categoryController</code><br />
        &nbsp;&nbsp;2. <code>singleCategoryController</code><br />
        - <code>models/categoryModel.js</code>
      </td>
    </tr>
    <tr>
      <td>Admin View Users</td>
      <td>- <code>pages/admin/Users.js</code></td>
      <td></td>
    </tr>
  </tbody>
</table>

### UI Test Contributions
<table>
  <thead>
    <tr>
      <th>Name</th>
      <th>Features</th>
      <th>Test Files (<code>test/e2e/</code>)</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td rowspan="4">Benjamin (<a href="https://github.com/benjiBase">@benjiBase</a>)</td>
      <td>Protected Routes</td>
    </tr>
    <tr>
      <td>Registration</td>
    </tr>
    <tr>
      <td>Login</td>
    </tr>
    <tr>
      <td>General</td>
    </tr>
    <tr>
      <td rowspan="4">Clement (<a href="https://github.com/Gra7ityIC3">@Gra7ityIC3</a>)</td>
      <td>Admin Dashboard</td>
    </tr>
    <tr>
      <td>Admin Actions</td>
    </tr>
    <tr>
      <td>Admin View Orders</td>
    </tr>
    <tr>
      <td>Admin View Products</td>
    </tr>
    <tr>
      <td rowspan="5">Wei Nian (<a href="https://github.com/hweinian">@hweinian</a>)</td>
      <td>Order</td>
    </tr>
    <tr>
      <td>Payment</td>
    </tr>
    <tr>
      <td>Cart</td>
      <td></td>
    </tr>
    <tr>
      <td>Search</td>
    </tr>
    <tr>
      <td>Home</td>
    </tr>
    <tr>
      <td rowspan="2">Chan How (<a href="https://github.com/ChillinRage">@ChillinRage</a>)</td>
      <td>Contact & Policy</td>
      <td> <code>HelpSupport.spec.js<code> </td>
    </tr>
    <tr>
      <td>Category Product</td>
      <td> <code>CategoryProductPage.spec.js<code> </td>
    </tr>
    <tr>
      <td rowspan="4">Yun Ru (<a href="https://github.com/yunruu">@yunruu</a>)</td>
      <td>General</td>
    </tr>
    <tr>
      <td>Profile</td>
    </tr>
    <tr>
      <td>Category</td>
    </tr>
    <tr>
      <td>Admin View Users</td>
    </tr>
  </tbody>
</table>
