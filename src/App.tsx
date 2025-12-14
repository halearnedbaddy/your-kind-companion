import { BrowserRouter, Routes, Route } from "react-router-dom";
import { PaymentPage } from "./pages/PaymentPage";
import { HomePage } from "./pages/HomePage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/pay/:transactionId" element={<PaymentPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
