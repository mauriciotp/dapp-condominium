import { SignerWithAddress } from '@nomicfoundation/hardhat-ethers/signers'
import { loadFixture } from '@nomicfoundation/hardhat-toolbox/network-helpers'
import { expect } from 'chai'
import { parseEther } from 'ethers'
import hre, { ethers } from 'hardhat'
import { CondominiumAdapter } from '../typechain-types'

enum Status {
  IDLE = 0,
  VOTING = 1,
  APPROVED = 2,
  DENIED = 3,
  DELETED = 4,
  SPENT = 5,
}

enum Options {
  EMPTY = 0,
  YES = 1,
  NO = 2,
  ABSTENTION = 3,
}

enum Category {
  DECISION = 0,
  SPENT = 1,
  CHANGE_QUOTA = 2,
  CHANGE_MANAGER = 3,
}

async function addResidents(
  adapter: CondominiumAdapter,
  count: number,
  accounts: SignerWithAddress[]
) {
  for (let i = 1; i <= count; i++) {
    const residenceId =
      1000 * Math.ceil(i / 25) +
      100 * Math.ceil(i / 5) +
      (i - 5 * Math.floor((i - 1) / 5))

    await adapter.addResident(accounts[i - 1].address, residenceId)

    const instance = adapter.connect(accounts[i - 1])
    await instance.payQuota(residenceId, { value: parseEther('0.001') })
  }
}

async function addVotes(
  adapter: CondominiumAdapter,
  count: number,
  accounts: SignerWithAddress[],
  shouldApprove = true
) {
  for (let i = 1; i <= count; i++) {
    const instance = adapter.connect(accounts[i - 1])
    await instance.vote('topic 1', shouldApprove ? Options.YES : Options.NO)
  }
}

describe('CondominiumAdapter', function () {
  async function deployAdapterFixture() {
    const [manager, resident, counselor, ...accounts] =
      await hre.ethers.getSigners()

    const CondominiumAdapter =
      await hre.ethers.getContractFactory('CondominiumAdapter')
    const condominiumAdapter = await CondominiumAdapter.deploy()

    return { condominiumAdapter, manager, resident, counselor, accounts }
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

  it('Should NOT add resident (upgrade)', async function () {
    const { condominiumAdapter, resident } =
      await loadFixture(deployAdapterFixture)

    await expect(
      condominiumAdapter.addResident(resident, 2505)
    ).to.be.revertedWith('You must upgrade first')
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

  it('Should NOT remove resident (upgrade)', async function () {
    const { condominiumAdapter, resident } =
      await loadFixture(deployAdapterFixture)

    await expect(
      condominiumAdapter.removeResident(resident.address)
    ).to.be.revertedWith('You must upgrade first')
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

  it('Should NOT set counselor (upgrade)', async function () {
    const { condominiumAdapter, resident } =
      await loadFixture(deployAdapterFixture)

    await expect(
      condominiumAdapter.setCounselor(resident.address, true)
    ).to.be.revertedWith('You must upgrade first')
  })

  it('Should add topic', async function () {
    const { condominiumAdapter, manager } =
      await loadFixture(deployAdapterFixture)
    const { condominium } = await loadFixture(deployImplementationFixture)

    const condominiumAddress = await condominium.getAddress()
    await condominiumAdapter.upgrade(condominiumAddress)

    await condominiumAdapter.addTopic(
      'topic 1',
      'description 1',
      Category.DECISION,
      0,
      manager.address
    )

    expect(await condominium.topicExists('topic 1')).to.equal(true)
  })

  it('Should NOT add topic (upgrade)', async function () {
    const { condominiumAdapter, manager } =
      await loadFixture(deployAdapterFixture)

    await expect(
      condominiumAdapter.addTopic(
        'topic 1',
        'description 1',
        Category.SPENT,
        1,
        manager.address
      )
    ).to.be.revertedWith('You must upgrade first')
  })

  it('Should edit topic', async function () {
    const { condominiumAdapter, manager } =
      await loadFixture(deployAdapterFixture)
    const { condominium } = await loadFixture(deployImplementationFixture)

    const condominiumAddress = await condominium.getAddress()
    await condominiumAdapter.upgrade(condominiumAddress)

    await condominiumAdapter.addTopic(
      'topic 1',
      'description 1',
      Category.SPENT,
      1,
      manager.address
    )

    await condominiumAdapter.editTopic(
      'topic 1',
      'new description',
      2,
      manager.address
    )

    const topic = await condominium.getTopic('topic 1')

    expect(topic.description).to.equal('new description')
  })

  it('Should NOT edit topic (upgrade)', async function () {
    const { condominiumAdapter, manager } =
      await loadFixture(deployAdapterFixture)

    await expect(
      condominiumAdapter.editTopic(
        'topic 1',
        'new description',
        1,
        manager.address
      )
    ).to.be.revertedWith('You must upgrade first')
  })

  it('Should remove topic', async function () {
    const { condominiumAdapter, manager } =
      await loadFixture(deployAdapterFixture)
    const { condominium } = await loadFixture(deployImplementationFixture)

    const condominiumAddress = await condominium.getAddress()
    await condominiumAdapter.upgrade(condominiumAddress)

    await condominiumAdapter.addTopic(
      'topic 1',
      'description 1',
      Category.DECISION,
      0,
      manager.address
    )
    await condominiumAdapter.removeTopic('topic 1')

    expect(await condominium.topicExists('topic 1')).to.equal(false)
  })

  it('Should NOT remove topic (upgrade)', async function () {
    const { condominiumAdapter } = await loadFixture(deployAdapterFixture)

    await expect(condominiumAdapter.removeTopic('topic 1')).to.be.revertedWith(
      'You must upgrade first'
    )
  })

  it('Should open voting', async function () {
    const { condominiumAdapter, manager } =
      await loadFixture(deployAdapterFixture)
    const { condominium } = await loadFixture(deployImplementationFixture)

    const condominiumAddress = await condominium.getAddress()
    await condominiumAdapter.upgrade(condominiumAddress)

    await condominiumAdapter.addTopic(
      'topic 1',
      'description 1',
      Category.DECISION,
      0,
      manager.address
    )
    await condominiumAdapter.openVoting('topic 1')
    const topic = await condominium.getTopic('topic 1')

    expect(topic.status).to.equal(Status.VOTING)
  })

  it('Should NOT open voting (upgrade)', async function () {
    const { condominiumAdapter } = await loadFixture(deployAdapterFixture)

    await expect(condominiumAdapter.openVoting('topic 1')).to.be.revertedWith(
      'You must upgrade first'
    )
  })

  it('Should vote', async function () {
    const { condominiumAdapter, manager, accounts } =
      await loadFixture(deployAdapterFixture)
    const { condominium } = await loadFixture(deployImplementationFixture)

    const condominiumAddress = await condominium.getAddress()
    await condominiumAdapter.upgrade(condominiumAddress)

    await addResidents(condominiumAdapter, 1, accounts)
    await condominiumAdapter.addTopic(
      'topic 1',
      'description 1',
      Category.DECISION,
      0,
      manager.address
    )
    await condominiumAdapter.openVoting('topic 1')

    const residentInstance = condominiumAdapter.connect(accounts[0])

    await residentInstance.vote('topic 1', Options.YES)

    expect(await condominium.numberOfVotes('topic 1')).to.equal(1)
  })

  it('Should NOT vote (upgrade)', async function () {
    const { condominiumAdapter } = await loadFixture(deployAdapterFixture)

    await expect(
      condominiumAdapter.vote('topic 1', Options.YES)
    ).to.be.revertedWith('You must upgrade first')
  })

  it('Should close voting (decision approved)', async function () {
    const { condominiumAdapter, manager, accounts } =
      await loadFixture(deployAdapterFixture)
    const { condominium } = await loadFixture(deployImplementationFixture)

    const condominiumAddress = await condominium.getAddress()
    await condominiumAdapter.upgrade(condominiumAddress)

    await addResidents(condominiumAdapter, 5, accounts)

    await condominiumAdapter.addTopic(
      'topic 1',
      'description 1',
      Category.DECISION,
      0,
      manager.address
    )
    await condominiumAdapter.openVoting('topic 1')

    await addVotes(condominiumAdapter, 5, accounts)

    await expect(condominiumAdapter.closeVoting('topic 1')).to.emit(
      condominiumAdapter,
      'TopicChanged'
    )
    const topic = await condominium.getTopic('topic 1')
    expect(topic.status).to.equal(Status.APPROVED)
  })

  it('Should close voting (decision denied)', async function () {
    const { condominiumAdapter, manager, accounts } =
      await loadFixture(deployAdapterFixture)
    const { condominium } = await loadFixture(deployImplementationFixture)

    const condominiumAddress = await condominium.getAddress()
    await condominiumAdapter.upgrade(condominiumAddress)

    await addResidents(condominiumAdapter, 5, accounts)

    await condominiumAdapter.addTopic(
      'topic 1',
      'description 1',
      Category.DECISION,
      0,
      manager.address
    )
    await condominiumAdapter.openVoting('topic 1')

    await addVotes(condominiumAdapter, 5, accounts, false)

    await expect(condominiumAdapter.closeVoting('topic 1')).to.emit(
      condominiumAdapter,
      'TopicChanged'
    )
    const topic = await condominium.getTopic('topic 1')
    expect(topic.status).to.equal(Status.DENIED)
  })

  it('Should close voting (change manager)', async function () {
    const { condominiumAdapter, accounts } =
      await loadFixture(deployAdapterFixture)
    const { condominium } = await loadFixture(deployImplementationFixture)

    const condominiumAddress = await condominium.getAddress()
    await condominiumAdapter.upgrade(condominiumAddress)

    await addResidents(condominiumAdapter, 15, accounts)

    await condominiumAdapter.addTopic(
      'topic 1',
      'description 1',
      Category.CHANGE_MANAGER,
      0,
      accounts[0].address
    )
    await condominiumAdapter.openVoting('topic 1')

    await addVotes(condominiumAdapter, 15, accounts)

    await expect(condominiumAdapter.closeVoting('topic 1'))
      .to.emit(condominiumAdapter, 'ManagerChanged')
      .withArgs(accounts[0].address)
  })

  it('Should close voting (change quota)', async function () {
    const { condominiumAdapter, manager, accounts } =
      await loadFixture(deployAdapterFixture)
    const { condominium } = await loadFixture(deployImplementationFixture)

    const condominiumAddress = await condominium.getAddress()
    await condominiumAdapter.upgrade(condominiumAddress)

    await addResidents(condominiumAdapter, 17, accounts)

    await condominiumAdapter.addTopic(
      'topic 1',
      'description 1',
      Category.CHANGE_QUOTA,
      100,
      manager.address
    )
    await condominiumAdapter.openVoting('topic 1')

    await addVotes(condominiumAdapter, 17, accounts)

    await expect(condominiumAdapter.closeVoting('topic 1'))
      .to.emit(condominiumAdapter, 'QuotaChanged')
      .withArgs(100)
  })

  it('Should NOT close voting (upgrade)', async function () {
    const { condominiumAdapter } = await loadFixture(deployAdapterFixture)

    await expect(condominiumAdapter.closeVoting('topic 1')).to.be.revertedWith(
      'You must upgrade first'
    )
  })

  it('Should NOT pay quota (upgrade)', async function () {
    const { condominiumAdapter } = await loadFixture(deployAdapterFixture)

    await expect(
      condominiumAdapter.payQuota(2505, { value: parseEther('0.001') })
    ).to.be.revertedWith('You must upgrade first')
  })

  it('Should transfer', async function () {
    const { condominiumAdapter, accounts } =
      await loadFixture(deployAdapterFixture)
    const { condominium } = await loadFixture(deployImplementationFixture)

    const condominiumAddress = await condominium.getAddress()
    await condominiumAdapter.upgrade(condominiumAddress)

    await addResidents(condominiumAdapter, 10, accounts)

    await condominiumAdapter.addTopic(
      'topic 1',
      'description 1',
      Category.SPENT,
      100,
      accounts[0]
    )
    await condominiumAdapter.openVoting('topic 1')

    await addVotes(condominiumAdapter, 10, accounts)

    await condominiumAdapter.closeVoting('topic 1')

    const balanceBefore = await ethers.provider.getBalance(condominiumAddress)
    const balanceWorkerBefore = await ethers.provider.getBalance(
      accounts[0].address
    )

    await condominiumAdapter.transfer('topic 1', 100)

    const balanceAfter = await ethers.provider.getBalance(condominiumAddress)
    const balanceWorkerAfter = await ethers.provider.getBalance(
      accounts[0].address
    )
    const topic = await condominium.getTopic('topic 1')

    expect(balanceAfter).to.equal(balanceBefore - 100n)
    expect(balanceWorkerAfter).to.equal(balanceWorkerBefore + 100n)
    expect(topic.status).to.equal(Status.SPENT)
  })

  it('Should NOT transfer (upgrade)', async function () {
    const { condominiumAdapter } = await loadFixture(deployAdapterFixture)

    await expect(
      condominiumAdapter.transfer('topic 1', 100)
    ).to.be.revertedWith('You must upgrade first')
  })
})
