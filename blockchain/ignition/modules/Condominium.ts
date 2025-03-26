// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition

import { buildModule } from '@nomicfoundation/hardhat-ignition/modules'

const CondominiumModule = buildModule('CondominiumModule', m => {
  const condominiumAdapter = m.contract('CondominiumAdapter')

  const condominium = m.contract('Condominium')

  m.call(condominiumAdapter, 'upgrade', [condominium])

  return { condominiumAdapter, condominium }
})

export default CondominiumModule
