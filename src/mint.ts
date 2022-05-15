import { BigNumber, providers, Wallet, ethers } from 'ethers'
import { FlashbotsBundleProvider, FlashbotsBundleResolution } from './index'
import * as dotenv from 'dotenv'
import axios from 'axios'
import { BaseProvider } from '@ethersproject/providers'

dotenv.config()

const FLASHBOTS_AUTH_KEY = process.env.FLASHBOTS_AUTH_KEY

const GWEI = BigNumber.from(10).pow(9)
const PRIORITY_FEE = GWEI.mul(process.env.PRIORITY_GWEI || 20)
const BLOCKS_IN_THE_FUTURE = 2

// ===== Uncomment this for mainnet =======
const CHAIN_ID = 1
const FLASHBOTS_EP = 'https://relay.flashbots.net/'
// ===== Uncomment this for mainnet =======

// ===== Uncomment this for Goerli =======
// const CHAIN_ID = 5
// const FLASHBOTS_EP = 'https://relay-goerli.flashbots.net/'
// ===== Uncomment this for Goerli =======
let provider: BaseProvider
if (process.env.ALCHEMY_API_KEY !== undefined) {
  provider = new providers.AlchemyProvider(CHAIN_ID, process.env.ALCHEMY_API_KEY)
} else if (process.env.INFURA_API_KEY !== undefined) {
  provider = new providers.InfuraProvider(CHAIN_ID, process.env.INFURA_API_KEY)
} else {
  console.log('Need to specify ALCHEMY_API_KEY or INFURA_API_KEY')
}

async function main() {
  const simpleTokenABI = (await import('./simpleToken.json')).default
  const landABI = (await import('./land.json')).default
  const drainProxyABI = (await import('./drainProxy.json')).default

  const authSigner = FLASHBOTS_AUTH_KEY ? new Wallet(FLASHBOTS_AUTH_KEY) : Wallet.createRandom()
  const user = new Wallet(process.env.USER_KEY || '', provider)
  const kyc = new Wallet(process.env.KYC_KEY || '', provider)
  let proof: string
  try {
    const res = await axios.get(`https://api.otherside.xyz/proofs/${kyc.address}`)
    proof = res.data
    if (proof == 'Proof Not Found') {
      console.log(`Proof not found for ${kyc.address}`)
      process.exit(0)
    }
  } catch (error) {
    console.log(`Proof not found for ${kyc.address}`)
    process.exit(0)
  }
  const mintAmount = parseInt(`${process.env.MINT_AMOUNT}`) || 1
  const userNonce = await user.getTransactionCount()
  const kycNonce = await kyc.getTransactionCount()
  let ape = new ethers.Contract(ethers.utils.getAddress(`${process.env.APE_CONTRACT}`), simpleTokenABI, kyc.provider)
  let land = new ethers.Contract(ethers.utils.getAddress(`${process.env.LAND_CONTRACT}`), landABI, kyc.provider)
  let drain = new ethers.Contract(ethers.utils.getAddress(`${process.env.DRAIN_PROXY_CONTRACT}`), drainProxyABI, kyc.provider)
  const flashbotsProvider = await FlashbotsBundleProvider.create(provider, authSigner, FLASHBOTS_EP)
  provider.on('block', async (blockNumber) => {
    const block = await provider.getBlock(blockNumber)

    const maxBaseFeeInFutureBlock = FlashbotsBundleProvider.getMaxBaseFeeInFutureBlock(<BigNumber>block.baseFeePerGas, BLOCKS_IN_THE_FUTURE)
    const sendEth = {
      to: kyc.address,
      from: user.address,
      nonce: userNonce,
      type: 2,
      maxFeePerGas: PRIORITY_FEE.add(maxBaseFeeInFutureBlock),
      maxPriorityFeePerGas: PRIORITY_FEE,
      gasLimit: 21000,
      value: ethers.utils.parseEther(`${process.env.ETH_AMOUNT}`),
      data: '0x',
      chainId: CHAIN_ID
    }
    ape = ape.connect(user)
    const sendApe = await ape.populateTransaction.transfer(kyc.address, ethers.utils.parseEther(`${305 * mintAmount}`))
    sendApe.gasLimit = ethers.BigNumber.from(150000)
    sendApe.maxFeePerGas = sendEth.maxFeePerGas
    sendApe.maxPriorityFeePerGas = PRIORITY_FEE
    sendApe.type = 2
    sendApe.chainId = CHAIN_ID

    ape = ape.connect(kyc)
    land = land.connect(kyc)
    drain = drain.connect(kyc)

    const apeLandApproveTx = await ape.populateTransaction.approve(land.address, ethers.constants.MaxUint256)
    apeLandApproveTx.nonce = kycNonce
    apeLandApproveTx.gasLimit = ethers.BigNumber.from(150000)
    apeLandApproveTx.maxFeePerGas = sendEth.maxFeePerGas
    apeLandApproveTx.maxPriorityFeePerGas = PRIORITY_FEE
    apeLandApproveTx.type = 2
    apeLandApproveTx.chainId = CHAIN_ID

    const apeDrainApproveTx = await ape.populateTransaction.approve(drain.address, ethers.constants.MaxUint256)
    apeDrainApproveTx.gasLimit = ethers.BigNumber.from(150000)
    apeDrainApproveTx.maxFeePerGas = sendEth.maxFeePerGas
    apeDrainApproveTx.maxPriorityFeePerGas = PRIORITY_FEE
    apeDrainApproveTx.type = 2
    apeDrainApproveTx.chainId = CHAIN_ID

    const landApproveAllTx = await land.populateTransaction.setApprovalForAll(drain.address, true)
    landApproveAllTx.gasLimit = ethers.BigNumber.from(150000)
    landApproveAllTx.maxFeePerGas = sendEth.maxFeePerGas
    landApproveAllTx.maxPriorityFeePerGas = PRIORITY_FEE
    landApproveAllTx.type = 2
    landApproveAllTx.chainId = CHAIN_ID

    const mintTx = await land.populateTransaction.mintLands(mintAmount, proof)
    mintTx.gasLimit = ethers.BigNumber.from(450000)
    mintTx.maxFeePerGas = sendEth.maxFeePerGas
    mintTx.maxPriorityFeePerGas = PRIORITY_FEE
    mintTx.type = 2
    mintTx.chainId = CHAIN_ID

    const drainTx = await drain.populateTransaction.drain(user.address)
    drainTx.gasLimit = ethers.BigNumber.from(800000)
    drainTx.maxFeePerGas = sendEth.maxFeePerGas
    drainTx.maxPriorityFeePerGas = PRIORITY_FEE
    drainTx.type = 2
    drainTx.chainId = CHAIN_ID

    const signedTransactions = await flashbotsProvider.signBundle([
      {
        signer: user,
        transaction: sendEth
      },
      {
        signer: kyc,
        transaction: apeLandApproveTx
      },
      {
        signer: kyc,
        transaction: apeDrainApproveTx
      },
      {
        signer: kyc,
        transaction: landApproveAllTx
      },
      {
        signer: user,
        transaction: sendApe
      },
      {
        signer: kyc,
        transaction: mintTx
      },
      {
        signer: kyc,
        transaction: drainTx
      }
    ])
    const targetBlock = blockNumber + BLOCKS_IN_THE_FUTURE
    const simulation = await flashbotsProvider.simulate(signedTransactions, targetBlock)
    // Using TypeScript discrimination
    if ('error' in simulation) {
      console.warn(`Simulation Error: ${simulation.error.message}`)
      process.exit(1)
    } else {
      console.log(`Simulation Success: ${JSON.stringify(simulation, null, 2)}`)
    }
    const bundleSubmission = await flashbotsProvider.sendRawBundle(signedTransactions, targetBlock)
    console.log('bundle submitted, waiting')
    if ('error' in bundleSubmission) {
      throw new Error(bundleSubmission.error.message)
    }
    const waitResponse = await bundleSubmission.wait()
    console.log(`Wait Response: ${FlashbotsBundleResolution[waitResponse]}`)
    if (waitResponse === FlashbotsBundleResolution.BundleIncluded || waitResponse === FlashbotsBundleResolution.AccountNonceTooHigh) {
      const returnETH = {
        to: user.address,
        from: kyc.address,
        nonce: await kyc.getTransactionCount(),
        type: 2,
        maxFeePerGas: PRIORITY_FEE.add(maxBaseFeeInFutureBlock),
        maxPriorityFeePerGas: PRIORITY_FEE,
        gasLimit: 21000,
        value: (await kyc.getBalance()).sub(PRIORITY_FEE.add(maxBaseFeeInFutureBlock).mul(21000)),
        data: '0x',
        chainId: CHAIN_ID
      }
      await kyc.sendTransaction(returnETH)
      process.exit(0)
    } else {
      console.log({
        bundleStats: await flashbotsProvider.getBundleStats(simulation.bundleHash, targetBlock),
        userStats: await flashbotsProvider.getUserStats()
      })
    }
  })
}

main()
