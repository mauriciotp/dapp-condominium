import { loadFixture } from '@nomicfoundation/hardhat-toolbox/network-helpers'
import { expect } from 'chai'
import { ZeroAddress } from 'ethers'
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
    const { condominium, counselor } = await loadFixture(deployFixture)

    await condominium.addResident(counselor.address, 2505)

    await condominium.setCounselor(counselor.address, true)

    await expect(
      condominium.removeResident(counselor.address)
    ).to.be.revertedWith('A counselor cannot be removed')
  })

  it('Should set counselor', async function () {
    const { condominium, counselor } = await loadFixture(deployFixture)

    await condominium.addResident(counselor.address, 2505)

    await condominium.setCounselor(counselor.address, true)

    expect(await condominium.counselors(counselor.address)).to.equal(true)
  })

  it('Should NOT set counselor (manager)', async function () {
    const { condominium, resident } = await loadFixture(deployFixture)

    const residentInstance = condominium.connect(resident)

    await expect(
      residentInstance.setCounselor(resident.address, true)
    ).to.be.revertedWith('Only manager can do this')
  })

  it('Should NOT set counselor (resident)', async function () {
    const { condominium, counselor } = await loadFixture(deployFixture)

    await expect(condominium.setCounselor(counselor, true)).to.be.revertedWith(
      'The counselor must be a resident'
    )
  })

  it('Should delete counselor', async function () {
    const { condominium, counselor } = await loadFixture(deployFixture)

    await condominium.addResident(counselor.address, 2505)

    await condominium.setCounselor(counselor.address, true)

    await condominium.setCounselor(counselor.address, false)

    expect(await condominium.counselors(counselor.address)).to.equal(false)
  })

  it('Should set manager', async function () {
    const { condominium, counselor } = await loadFixture(deployFixture)

    await condominium.setManager(counselor.address)

    expect(await condominium.manager()).to.equal(counselor.address)
  })

  it('Should NOT set manager (manager)', async function () {
    const { condominium, resident } = await loadFixture(deployFixture)

    const residentInstance = condominium.connect(resident)

    await expect(
      residentInstance.setManager(resident.address)
    ).to.be.revertedWith('Only manager can do this')
  })

  it('Should NOT set manager (address)', async function () {
    const { condominium } = await loadFixture(deployFixture)

    await expect(condominium.setManager(ZeroAddress)).to.be.revertedWith(
      'The address must be valid'
    )
  })
})
