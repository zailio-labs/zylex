import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import {
  Home,
  WishList,
  ProtectedRoute,
  AdminProtectedRoute,
  CartProtectedRoute,
  PageNotFound,
  ProductDetails,
  ProductByCategory,
  CheckoutPage,
} from "./shop";
import { DashboardAdmin, Categories, Products, Orders } from "./admin";
import { UserProfile, UserOrders, SettingUser } from "./shop/dashboardUser";

const AppRoutes = (props) => {
  return (
    <Router>
      <Routes>
        {/* Shop & Public Routes */}
        <Route path="/" element={<Home />} />
        <Route path="/wish-list" element={<WishList />} />
        <Route path="/products/:id" element={<ProductDetails />} />
        <Route path="/products/category/:catId" element={<ProductByCategory />} />
        <Route path="/checkout" element={<CartProtectedRoute><CheckoutPage /></CartProtectedRoute>} />

        {/* Admin Routes */}
        <Route path="/admin/dashboard" element={<AdminProtectedRoute><DashboardAdmin /></AdminProtectedRoute>} />
        <Route path="/admin/dashboard/categories" element={<AdminProtectedRoute><Categories /></AdminProtectedRoute>} />
        <Route path="/admin/dashboard/products" element={<AdminProtectedRoute><Products /></AdminProtectedRoute>} />
        <Route path="/admin/dashboard/orders" element={<AdminProtectedRoute><Orders /></AdminProtectedRoute>} />

        {/* User Dashboard */}
        <Route path="/user/profile" element={<ProtectedRoute><UserProfile /></ProtectedRoute>} />
        <Route path="/user/orders" element={<ProtectedRoute><UserOrders /></ProtectedRoute>} />
        <Route path="/user/setting" element={<ProtectedRoute><SettingUser /></ProtectedRoute>} />

        {/* 404 Page */}
        <Route path="*" element={<PageNotFound />} />
      </Routes>
    </Router>
  );
};

export default AppRoutes;
