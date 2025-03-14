import { loadFixture } from '@nomicfoundation/hardhat-toolbox/network-helpers'
import { expect } from 'chai'
import hre from 'hardhat'

describe('Condominium', function () {
  async function deployFixture() {
    const [manager, resident, counselor] = await hre.ethers.getSigners()

    const Condominium = await hre.ethers.getContractFactory('Condominium')
    const condominium = await Condominium.deploy()

    return { condominium, manager, resident, counselor }
  }

  it('Should be residence', async function () {
    const { condominium } = await loadFixture(deployFixture)

    expect(await condominium.residenceExists(2102)).to.equal(true)
  })

  it('Should add resident', async function () {
    const { condominium, resident } = await loadFixture(deployFixture)

    await condominium.addResident(resident.address, 2505)

    expect(await condominium.isResident(resident.address)).to.equal(true)
  })

  it('Should NOT add resident (council)', async function () {
    const { condominium, resident } = await loadFixture(deployFixture)

    const residentInstance = condominium.connect(resident)

    await expect(
      residentInstance.addResident(resident.address, 2505)
    ).to.be.revertedWith('Only the manager or the council can do this')
  })

  it('Should NOT add resident (residence)', async function () {
    const { condominium, resident } = await loadFixture(deployFixture)

    await expect(
      condominium.addResident(resident.address, 2506)
    ).to.be.revertedWith('Residence does not exist')
  })

  it('Should remove resident', async function () {
    const { condominium, resident } = await loadFixture(deployFixture)

    await condominium.addResident(resident.address, 2505)
    await condominium.removeResident(resident.address)

    expect(await condominium.isResident(resident.address)).to.equal(false)
  })

  it('Should NOT remove resident (manager)', async function () {
    const { condominium, resident } = await loadFixture(deployFixture)

    await condominium.addResident(resident.address, 2505)

    const residentInstance = condominium.connect(resident)

    await expect(
      residentInstance.removeResident(resident.address)
    ).to.be.revertedWith('Only manager can do this')
  })

  it('Should NOT remove resident (counselor)', async function () {
    const { condominium, resident, counselor } =
      await loadFixture(deployFixture)

    await condominium.addResident(counselor.address, 2505)
    await condominium.removeResident(counselor.address)

    //TODO: add counselor

    expect(await condominium.isResident(resident.address)).to.equal(false)
  })
})
