import { loadFixture } from '@nomicfoundation/hardhat-toolbox/network-helpers'
import { expect } from 'chai'
import hre from 'hardhat'

enum Status {
  IDLE = 0,
  VOTING = 1,
  APPROVED = 2,
  DENIED = 3,
}

enum Options {
  EMPTY = 0,
  YES = 1,
  NO = 2,
  ABSTENTION = 3,
}

describe('CondominiumAdapter', function () {
  async function deployAdapterFixture() {
    const [manager, resident, counselor] = await hre.ethers.getSigners()

    const CondominiumAdapter =
      await hre.ethers.getContractFactory('CondominiumAdapter')
    const condominiumAdapter = await CondominiumAdapter.deploy()

    return { condominiumAdapter, manager, resident, counselor }
  }

  async function deployImplementationFixture() {
    const Condominium = await hre.ethers.getContractFactory('Condominium')
    const condominium = await Condominium.deploy()

    return { condominium }
  }

  it('Should upgrade', async function () {
    const { condominiumAdapter } = await loadFixture(deployAdapterFixture)

    const { condominium } = await loadFixture(deployImplementationFixture)

    const condominiumAddress = await condominium.getAddress()

    await condominiumAdapter.upgrade(condominiumAddress)
    const implementationAddress =
      await condominiumAdapter.getImplementationAddress()

    expect(implementationAddress).to.equal(condominiumAddress)
  })

  it('Should NOT upgrade (permission)', async function () {
    const { condominiumAdapter, resident } =
      await loadFixture(deployAdapterFixture)
    const { condominium } = await loadFixture(deployImplementationFixture)

    const condominiumAddress = await condominium.getAddress()

    const residentInstance = condominiumAdapter.connect(resident)

    await expect(
      residentInstance.upgrade(condominiumAddress)
    ).to.be.revertedWith('You do not have permission')
  })

  it('Should add resident', async function () {
    const { condominiumAdapter, resident } =
      await loadFixture(deployAdapterFixture)
    const { condominium } = await loadFixture(deployImplementationFixture)

    const condominiumAddress = await condominium.getAddress()
    await condominiumAdapter.upgrade(condominiumAddress)

    await condominiumAdapter.addResident(resident, 2505)

    expect(await condominium.isResident(resident.address)).to.equal(true)
  })

  it('Should remove resident', async function () {
    const { condominiumAdapter, resident } =
      await loadFixture(deployAdapterFixture)
    const { condominium } = await loadFixture(deployImplementationFixture)

    const condominiumAddress = await condominium.getAddress()
    await condominiumAdapter.upgrade(condominiumAddress)

    await condominiumAdapter.addResident(resident.address, 2505)

    await condominiumAdapter.removeResident(resident.address)

    expect(await condominium.isResident(resident.address)).to.equal(false)
  })

  it('Should set counselor', async function () {
    const { condominiumAdapter, resident } =
      await loadFixture(deployAdapterFixture)
    const { condominium } = await loadFixture(deployImplementationFixture)

    const condominiumAddress = await condominium.getAddress()
    await condominiumAdapter.upgrade(condominiumAddress)

    await condominiumAdapter.addResident(resident.address, 2505)

    await condominiumAdapter.setCounselor(resident.address, true)

    expect(await condominium.counselors(resident.address)).to.equal(true)
  })

  it('Should add topic', async function () {
    const { condominiumAdapter } = await loadFixture(deployAdapterFixture)
    const { condominium } = await loadFixture(deployImplementationFixture)

    const condominiumAddress = await condominium.getAddress()
    await condominiumAdapter.upgrade(condominiumAddress)

    await condominiumAdapter.addTopic('topic 1', 'description 1')

    expect(await condominium.topicExists('topic 1')).to.equal(true)
  })

  it('Should remove topic', async function () {
    const { condominiumAdapter } = await loadFixture(deployAdapterFixture)
    const { condominium } = await loadFixture(deployImplementationFixture)

    const condominiumAddress = await condominium.getAddress()
    await condominiumAdapter.upgrade(condominiumAddress)

    await condominiumAdapter.addTopic('topic 1', 'description 1')
    await condominiumAdapter.removeTopic('topic 1')

    expect(await condominium.topicExists('topic 1')).to.equal(false)
  })

  it('Should open voting', async function () {
    const { condominiumAdapter } = await loadFixture(deployAdapterFixture)
    const { condominium } = await loadFixture(deployImplementationFixture)

    const condominiumAddress = await condominium.getAddress()
    await condominiumAdapter.upgrade(condominiumAddress)

    await condominiumAdapter.addTopic('topic 1', 'description 1')
    await condominiumAdapter.openVoting('topic 1')
    const topic = await condominium.getTopic('topic 1')

    expect(topic.status).to.equal(Status.VOTING)
  })

  it('Should vote', async function () {
    const { condominiumAdapter, resident } =
      await loadFixture(deployAdapterFixture)
    const { condominium } = await loadFixture(deployImplementationFixture)

    const condominiumAddress = await condominium.getAddress()
    await condominiumAdapter.upgrade(condominiumAddress)

    await condominiumAdapter.addResident(resident.address, 2505)
    await condominiumAdapter.addTopic('topic 1', 'description 1')
    await condominiumAdapter.openVoting('topic 1')

    const residentInstance = condominiumAdapter.connect(resident)

    await residentInstance.vote('topic 1', Options.YES)

    expect(await condominium.numberOfVotes('topic 1')).to.equal(1)
  })

  it('Should close voting', async function () {
    const { condominiumAdapter, resident } =
      await loadFixture(deployAdapterFixture)
    const { condominium } = await loadFixture(deployImplementationFixture)

    const condominiumAddress = await condominium.getAddress()
    await condominiumAdapter.upgrade(condominiumAddress)

    await condominiumAdapter.addResident(resident.address, 2505)
    await condominiumAdapter.addTopic('topic 1', 'description 1')
    await condominiumAdapter.openVoting('topic 1')

    const residentInstance = condominiumAdapter.connect(resident)

    await residentInstance.vote('topic 1', Options.YES)
    await condominiumAdapter.closeVoting('topic 1')

    const topic = await condominium.getTopic('topic 1')

    expect(topic.status).to.equal(Status.APPROVED)
  })
})
