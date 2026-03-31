import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { CartProvider } from "@/contexts/CartContext";
import { AdminAuthProvider } from "@/contexts/AdminAuthContext";
import Index from "./pages/Index.tsx";
import Catalog from "./pages/Catalog.tsx";
import ProductDetail from "./pages/ProductDetail.tsx";
import Cart from "./pages/Cart.tsx";
import Checkout from "./pages/Checkout.tsx";
import PaymentStatus from "./pages/PaymentStatus.tsx";
import ThankYou from "./pages/ThankYou.tsx";
import OrderTracking from "./pages/OrderTracking.tsx";
import NotFound from "./pages/NotFound.tsx";
import WhatsAppFloat from "./components/WhatsAppFloat.tsx";
import AdminLogin from "./pages/admin/AdminLogin.tsx";
import AdminLayout from "./components/admin/AdminLayout.tsx";
import AdminDashboard from "./pages/admin/AdminDashboard.tsx";
import AdminOrders from "./pages/admin/AdminOrders.tsx";
import AdminOrderDetail from "./pages/admin/AdminOrderDetail.tsx";
import AdminProducts from "./pages/admin/AdminProducts.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <CartProvider>
        <AdminAuthProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/catalogo" element={<Catalog />} />
              <Route path="/catalogo/:categoria" element={<Catalog />} />
              <Route path="/produto/:slug" element={<ProductDetail />} />
              <Route path="/carrinho" element={<Cart />} />
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/pagamento/status" element={<PaymentStatus />} />
              <Route path="/obrigado" element={<ThankYou />} />
              <Route path="/meu-pedido" element={<OrderTracking />} />
              {/* Admin routes — hidden, no menu link */}
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<AdminDashboard />} />
                <Route path="pedidos" element={<AdminOrders />} />
                <Route path="pedidos/:id" element={<AdminOrderDetail />} />
                <Route path="produtos" element={<AdminProducts />} />
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
            <WhatsAppFloat />
          </BrowserRouter>
        </AdminAuthProvider>
      </CartProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
