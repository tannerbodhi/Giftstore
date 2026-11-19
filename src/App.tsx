import '@rainbow-me/rainbowkit/styles.css';
import { useState } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider } from 'wagmi';
import { RainbowKitProvider } from '@rainbow-me/rainbowkit';
import { wagmiConfig, giftstoreRainbowTheme } from './lib/wagmi';
import { Layout } from './components/Layout';
import { HomePage } from './pages/HomePage';
import { CreateVoucherPage } from './pages/CreateVoucherPage';
import { MyVouchersPage } from './pages/MyVouchersPage';
import { VoucherDetailPage } from './pages/VoucherDetailPage';
import { GiftOpenedPage } from './pages/GiftOpenedPage';

export default function App() {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      })
  );

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider theme={giftstoreRainbowTheme}>
          <BrowserRouter>
            <Layout>
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/create" element={<CreateVoucherPage />} />
                <Route path="/vouchers" element={<MyVouchersPage />} />
                <Route path="/voucher/:id" element={<VoucherDetailPage />} />
                <Route path="/gift/:id" element={<GiftOpenedPage />} />
                <Route path="*" element={<HomePage />} />
              </Routes>
            </Layout>
          </BrowserRouter>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
