import { useWeb3Modal, useWeb3ModalAccount } from '@web3modal/ethers/react'

export const useWalletInterface = () => {
  const { open } = useWeb3Modal()
  const { address, isConnected } = useWeb3ModalAccount()

  const connect = () => open()

  return { walletInterface: { connect }, accountId: address, isConnected }
}
