import { connectorsForWallets, lightTheme } from '@rainbow-me/rainbowkit';
import {
  coinbaseWallet,
  injectedWallet,
  metaMaskWallet,
  rainbowWallet,
  walletConnectWallet,
} from '@rainbow-me/rainbowkit/wallets';
import { createConfig, http } from 'wagmi';
import { ARC_RPC_URL, WALLETCONNECT_PROJECT_ID, arcChain } from './chain';

const hasWalletConnectId = Boolean(WALLETCONNECT_PROJECT_ID);

const connectors = connectorsForWallets(
  hasWalletConnectId
    ? [
        {
          groupName: 'Recommended',
          wallets: [
            injectedWallet,
            metaMaskWallet,
            rainbowWallet,
            coinbaseWallet,
            walletConnectWallet,
          ],
        },
      ]
    : [
        {
          groupName: 'Browser Wallets',
          wallets: [injectedWallet],
        },
      ],
  {
    appName: 'Giftstore',
    projectId: WALLETCONNECT_PROJECT_ID || 'giftstore-browser-wallet',
  }
);

export const wagmiConfig = createConfig({
  connectors,
  chains: [arcChain],
  transports: {
    [arcChain.id]: http(ARC_RPC_URL),
  },
  ssr: false,
});

export const giftstoreRainbowTheme = lightTheme({
  accentColor: '#B3123A',
  accentColorForeground: '#FFFFFF',
  borderRadius: 'large',
  fontStack: 'system',
  overlayBlur: 'small',
});
