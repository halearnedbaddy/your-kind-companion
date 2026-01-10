import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { PaymentPage } from "./pages/PaymentPage";
import { HomePage } from "./pages/HomePage";
import { SellerDashboard } from "./pages/SellerDashboard";
import { BuyerDashboard } from "./pages/BuyerDashboard";
import { AdminDashboard } from "./pages/AdminDashboard";
import { LoginPage } from "./pages/LoginPage";
import { SignupPage } from "./pages/SignupPage";
import { AdminLoginPage } from "./pages/AdminLoginPage";
import { LegalPage } from "./pages/LegalPage";
import { NotFoundPage } from "./pages/NotFoundPage";
import { StoreFrontPage } from "./pages/StoreFrontPage";
import { ProductDetailPage } from "./pages/ProductDetailPage";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/seller" element={<SellerDashboard />} />
          <Route path="/buyer" element={<BuyerDashboard />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/admin/login" element={<AdminLoginPage />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/pay/:transactionId" element={<PaymentPage />} />
          <Route path="/store/:storeSlug" element={<StoreFrontPage />} />
          <Route path="/store/:storeSlug/product/:productId" element={<ProductDetailPage />} />
          <Route path="/legal" element={<LegalPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
