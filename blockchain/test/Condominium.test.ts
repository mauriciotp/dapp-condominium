import { SignerWithAddress } from '@nomicfoundation/hardhat-ethers/signers'
import {
  loadFixture,
  time,
} from '@nomicfoundation/hardhat-toolbox/network-helpers'
import { expect } from 'chai'
import { ZeroAddress, parseEther } from 'ethers'
import hre from 'hardhat'
import { Condominium } from '../typechain-types'

enum Status {
  IDLE = 0,
  VOTING = 1,
  APPROVED = 2,
  DENIED = 3,
  SPENT = 4,
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
  contract: Condominium,
  count: number,
  accounts: SignerWithAddress[]
) {
  for (let i = 1; i <= count; i++) {
    const residenceId =
      1000 * Math.ceil(i / 25) +
      100 * Math.ceil(i / 5) +
      (i - 5 * Math.floor((i - 1) / 5))

    await contract.addResident(accounts[i - 1].address, residenceId)

    const instance = contract.connect(accounts[i - 1])
    await instance.payQuota(residenceId, { value: parseEther('0.001') })
  }
}

async function addVotes(
  contract: Condominium,
  count: number,
  accounts: SignerWithAddress[],
  shouldApprove = true
) {
  for (let i = 1; i <= count; i++) {
    const instance = contract.connect(accounts[i - 1])
    await instance.vote('topic 1', shouldApprove ? Options.YES : Options.NO)
  }
}

describe('Condominium', function () {
  async function deployFixture() {
    const [manager, resident, counselor, ...accounts] =
      await hre.ethers.getSigners()

    const Condominium = await hre.ethers.getContractFactory('Condominium')
    const condominium = await Condominium.deploy()

    return { condominium, manager, resident, counselor, accounts }
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

  it('Should add resident (address)', async function () {
    const { condominium } = await loadFixture(deployFixture)

    await expect(condominium.addResident(ZeroAddress, 2505)).to.be.revertedWith(
      'Invalid address'
    )
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

  it('Should remove resident (latest)', async function () {
    const { condominium, resident } = await loadFixture(deployFixture)

    await condominium.addResident(resident.address, 2505)
    await condominium.removeResident(resident.address)

    expect(await condominium.isResident(resident.address)).to.equal(false)
  })

  it('Should remove resident (first)', async function () {
    const { condominium, resident, accounts } = await loadFixture(deployFixture)

    await condominium.addResident(resident.address, 2505)
    await condominium.addResident(accounts[0].address, 2504)

    await condominium.setCounselor(accounts[0].address, true)

    await condominium.removeResident(resident.address)

    expect(await condominium.isResident(resident.address)).to.equal(false)
  })

  it('Should NOT remove resident (manager)', async function () {
    const { condominium, resident } = await loadFixture(deployFixture)

    await condominium.addResident(resident.address, 2505)

    const residentInstance = condominium.connect(resident)

    await expect(
      residentInstance.removeResident(resident.address)
    ).to.be.revertedWith('Only the manager can do this')
  })

  it('Should NOT remove resident (counselor)', async function () {
    const { condominium, counselor } = await loadFixture(deployFixture)

    await condominium.addResident(counselor.address, 2505)

    await condominium.setCounselor(counselor.address, true)

    await expect(
      condominium.removeResident(counselor.address)
    ).to.be.revertedWith('A counselor cannot be removed')
  })

  it('Should add counselor', async function () {
    const { condominium, counselor, resident } =
      await loadFixture(deployFixture)

    await condominium.addResident(counselor.address, 2505)

    await condominium.setCounselor(counselor.address, true)

    const counselorInstance = condominium.connect(counselor)

    await counselorInstance.addResident(resident, 2504)

    const newCounselor = await condominium.getResident(counselor.address)

    expect(newCounselor.isCounselor).to.equal(true)
    expect(await condominium.isResident(resident.address)).to.equal(true)
  })

  it('Should remove counselor (latest)', async function () {
    const { condominium, counselor } = await loadFixture(deployFixture)

    await condominium.addResident(counselor.address, 2505)

    await condominium.setCounselor(counselor.address, true)

    await condominium.setCounselor(counselor.address, false)

    const resident = await condominium.getResident(counselor.address)

    expect(resident.isCounselor).to.equal(false)
  })

  it('Should remove counselor (first)', async function () {
    const { condominium, counselor, accounts } =
      await loadFixture(deployFixture)

    await condominium.addResident(counselor.address, 2505)
    await condominium.addResident(accounts[0], 2504)

    await condominium.setCounselor(counselor.address, true)
    await condominium.setCounselor(accounts[0].address, true)

    await condominium.setCounselor(counselor.address, false)

    const resident = await condominium.getResident(counselor.address)

    expect(resident.isCounselor).to.equal(false)
  })

  it('Should NOT remove counselor (address)', async function () {
    const { condominium } = await loadFixture(deployFixture)

    await expect(
      condominium.setCounselor(ZeroAddress, false)
    ).to.be.revertedWith('Invalid address')
  })

  it('Should NOT remove counselor (permission)', async function () {
    const { condominium, resident, counselor } =
      await loadFixture(deployFixture)

    await condominium.addResident(counselor.address, 2505)
    await condominium.setCounselor(counselor.address, true)

    const residentInstance = condominium.connect(resident)

    await expect(
      residentInstance.setCounselor(counselor.address, false)
    ).to.be.revertedWith('Only the manager can do this')
  })

  it('Should NOT remove counselor (exists)', async function () {
    const { condominium, counselor } = await loadFixture(deployFixture)

    await expect(
      condominium.setCounselor(counselor.address, false)
    ).to.be.revertedWith('Counselor not found')
  })

  it('Should NOT add counselor (address)', async function () {
    const { condominium } = await loadFixture(deployFixture)

    await expect(
      condominium.setCounselor(ZeroAddress, true)
    ).to.be.revertedWith('Invalid address')
  })

  it('Should NOT add counselor (permission)', async function () {
    const { condominium, resident } = await loadFixture(deployFixture)

    const residentInstance = condominium.connect(resident)

    await expect(
      residentInstance.setCounselor(resident.address, true)
    ).to.be.revertedWith('Only the manager can do this')
  })

  it('Should NOT add counselor (resident)', async function () {
    const { condominium, counselor } = await loadFixture(deployFixture)

    await expect(condominium.setCounselor(counselor, true)).to.be.revertedWith(
      'The counselor must be a resident'
    )
  })

  it('Should NOT add counselor (exists)', async function () {
    const { condominium, counselor, resident } =
      await loadFixture(deployFixture)

    await condominium.addResident(counselor.address, 2505)

    await condominium.setCounselor(counselor.address, true)

    await expect(
      condominium.setCounselor(resident.address, false)
    ).to.be.revertedWith('Counselor not found')
  })

  it('Should change manager', async function () {
    const { condominium, manager, accounts } = await loadFixture(deployFixture)

    await condominium.addResident(manager.address, 2505)
    await addResidents(condominium, 15, accounts)
    await condominium.addTopic(
      'topic 1',
      'description 1',
      Category.CHANGE_MANAGER,
      0,
      '0x1234567890AbcdEF1234567890aBcdef12345678'
    )
    await condominium.openVoting('topic 1')

    await addVotes(condominium, 15, accounts)

    await condominium.closeVoting('topic 1')

    expect(await condominium.manager()).to.equal(
      '0x1234567890AbcdEF1234567890aBcdef12345678'
    )
  })

  it('Should change quota', async function () {
    const { condominium, manager, accounts } = await loadFixture(deployFixture)

    await addResidents(condominium, 17, accounts)
    const value = parseEther('0.002')
    await condominium.addTopic(
      'topic 1',
      'description 1',
      Category.CHANGE_QUOTA,
      value,
      manager.address
    )
    await condominium.openVoting('topic 1')

    await addVotes(condominium, 17, accounts)

    await condominium.closeVoting('topic 1')

    expect(await condominium.monthlyQuota()).to.equal(value)
  })

  it('Should add topic (manager)', async function () {
    const { condominium, manager } = await loadFixture(deployFixture)

    await condominium.addTopic(
      'topic 1',
      'description 1',
      Category.DECISION,
      0,
      manager.address
    )

    expect(await condominium.topicExists('topic 1')).to.equal(true)
  })

  it('Should get topic', async function () {
    const { condominium, manager } = await loadFixture(deployFixture)

    await condominium.addTopic(
      'topic 1',
      'description 1',
      Category.DECISION,
      0,
      manager.address
    )

    await condominium.addTopic(
      'topic 2',
      'description 2',
      Category.DECISION,
      0,
      manager.address
    )

    const topic = await condominium.getTopic('topic 2')

    expect(topic.title).to.equal('topic 2')
  })

  it('Should NOT add topic (amount)', async function () {
    const { condominium, manager } = await loadFixture(deployFixture)

    await expect(
      condominium.addTopic(
        'topic 1',
        'description 1',
        Category.DECISION,
        10,
        manager.address
      )
    ).to.be.revertedWith('Wrong category')
  })

  it('Should add topic (resident)', async function () {
    const { condominium, manager, accounts } = await loadFixture(deployFixture)

    await addResidents(condominium, 1, accounts)

    const residentInstance = condominium.connect(accounts[0])

    await residentInstance.addTopic(
      'topic 1',
      'description 1',
      Category.DECISION,
      0,
      manager.address
    )

    expect(await condominium.topicExists('topic 1')).to.equal(true)
  })

  it('Should NOT add topic (permission)', async function () {
    const { condominium, manager, resident } = await loadFixture(deployFixture)

    const residentInstance = condominium.connect(resident)

    await expect(
      residentInstance.addTopic(
        'topic 1',
        'description 1',
        Category.DECISION,
        0,
        manager.address
      )
    ).to.be.revertedWith('Only the manager or the residents can do this')
  })

  it('Should NOT add topic (topic exists)', async function () {
    const { condominium, manager } = await loadFixture(deployFixture)

    await condominium.addTopic(
      'topic 1',
      'description 1',
      Category.DECISION,
      0,
      manager.address
    )

    await expect(
      condominium.addTopic(
        'topic 1',
        'description 1',
        Category.DECISION,
        0,
        manager.address
      )
    ).to.be.revertedWith('Topic already exists')
  })

  it('Should edit topic', async function () {
    const { condominium, manager } = await loadFixture(deployFixture)

    await condominium.addTopic(
      'topic 1',
      'description 1',
      Category.SPENT,
      0,
      manager.address
    )

    await condominium.editTopic(
      'topic 1',
      'new description',
      1,
      manager.address
    )

    const topic = await condominium.getTopic('topic 1')

    expect(topic.description).to.equal('new description')
  })

  it('Should edit topic (nothing)', async function () {
    const { condominium, manager } = await loadFixture(deployFixture)

    await condominium.addTopic(
      'topic 1',
      'description 1',
      Category.SPENT,
      1,
      manager.address
    )

    await condominium.editTopic('topic 1', '', 0, ZeroAddress)

    const topic = await condominium.getTopic('topic 1')

    expect(topic.description).to.equal('description 1')
  })

  it('Should NOT edit topic (permission)', async function () {
    const { condominium, manager, resident } = await loadFixture(deployFixture)

    const residentInstance = condominium.connect(resident)

    await condominium.addTopic(
      'topic 1',
      'description 1',
      Category.SPENT,
      0,
      manager.address
    )

    await expect(
      residentInstance.editTopic(
        'topic 1',
        'new description',
        1,
        manager.address
      )
    ).to.be.revertedWith('Only the manager can do this')
  })

  it('Should NOT edit topic (topic not exists)', async function () {
    const { condominium, manager } = await loadFixture(deployFixture)

    await expect(
      condominium.editTopic('topic 1', 'new description', 1, manager.address)
    ).to.be.revertedWith('This topic does not exists')
  })

  it('Should NOT edit topic (status))', async function () {
    const { condominium, manager } = await loadFixture(deployFixture)

    await condominium.addTopic(
      'topic 1',
      'description 1',
      Category.SPENT,
      0,
      manager.address
    )

    await condominium.openVoting('topic 1')

    await expect(
      condominium.editTopic('topic 1', 'new description', 1, manager.address)
    ).to.be.revertedWith('Only IDLE topics can be edited')
  })

  it('Should remove topic (latest)', async function () {
    const { condominium, manager } = await loadFixture(deployFixture)

    await condominium.addTopic(
      'topic 1',
      'description 1',
      Category.DECISION,
      0,
      manager.address
    )

    await condominium.removeTopic('topic 1')

    expect(await condominium.topicExists('topic 1')).to.equal(false)
  })

  it('Should remove topic (first)', async function () {
    const { condominium, manager } = await loadFixture(deployFixture)

    await condominium.addTopic(
      'topic 1',
      'description 1',
      Category.DECISION,
      0,
      manager.address
    )

    await condominium.addTopic(
      'topic 2',
      'description 2',
      Category.DECISION,
      0,
      manager.address
    )

    await condominium.removeTopic('topic 1')

    expect(await condominium.topicExists('topic 1')).to.equal(false)
  })

  it('Should NOT remove topic (permission)', async function () {
    const { condominium, resident } = await loadFixture(deployFixture)

    const residentInstance = condominium.connect(resident)

    await expect(residentInstance.removeTopic('topic 1')).to.be.revertedWith(
      'Only the manager can do this'
    )
  })

  it('Should NOT remove topic (topic not exists)', async function () {
    const { condominium } = await loadFixture(deployFixture)

    await expect(condominium.removeTopic('topic 1')).to.be.revertedWith(
      'Topic does not exists'
    )
  })

  it('Should NOT remove topic (status)', async function () {
    const { condominium, manager } = await loadFixture(deployFixture)

    await condominium.addTopic(
      'topic 1',
      'description 1',
      Category.DECISION,
      0,
      manager.address
    )

    await condominium.openVoting('topic 1')

    await expect(condominium.removeTopic('topic 1')).to.be.revertedWith(
      'Only IDLE topics can be removed'
    )
  })

  it('Should open topic to voting', async function () {
    const { condominium, manager } = await loadFixture(deployFixture)

    await condominium.addTopic(
      'topic 1',
      'description 1',
      Category.DECISION,
      0,
      manager.address
    )

    await condominium.openVoting('topic 1')

    const topic = await condominium.getTopic('topic 1')

    const newStatus = topic.status

    expect(newStatus).to.equal(Status.VOTING)
  })

  it('Should NOT open topic to voting (permission)', async function () {
    const { condominium, resident, manager } = await loadFixture(deployFixture)

    await condominium.addResident(resident.address, 2505)

    await condominium.addTopic(
      'topic 1',
      'description 1',
      Category.DECISION,
      0,
      manager.address
    )

    const residentInstance = condominium.connect(resident)

    await expect(residentInstance.openVoting('topic 1')).to.be.revertedWith(
      'Only the manager can do this'
    )
  })

  it('Should NOT open topic to voting (status)', async function () {
    const { condominium, manager } = await loadFixture(deployFixture)

    await condominium.addTopic(
      'topic 1',
      'description 1',
      Category.DECISION,
      0,
      manager.address
    )

    await condominium.openVoting('topic 1')

    await expect(condominium.openVoting('topic 1')).to.be.revertedWith(
      'Only IDLE topics can be open to voting'
    )
  })

  it('Should NOT open topic to voting (exists)', async function () {
    const { condominium } = await loadFixture(deployFixture)

    await expect(condominium.openVoting('topic 1')).to.be.revertedWith(
      'Topic does not exists'
    )
  })

  it('Should vote in a topic', async function () {
    const { condominium, manager, accounts } = await loadFixture(deployFixture)

    await addResidents(condominium, 1, accounts)
    await condominium.addTopic(
      'topic 1',
      'description 1',
      Category.DECISION,
      0,
      manager.address
    )

    await condominium.openVoting('topic 1')

    const residentInstance = condominium.connect(accounts[0])

    await residentInstance.vote('topic 1', Options.ABSTENTION)

    expect(await condominium.numberOfVotes('topic 1')).to.equal(1)
  })

  it('Should NOT vote in a topic (permission)', async function () {
    const { condominium, resident, manager } = await loadFixture(deployFixture)

    await condominium.addTopic(
      'topic 1',
      'description 1',
      Category.DECISION,
      0,
      manager.address
    )
    await condominium.openVoting('topic 1')

    const residentInstance = condominium.connect(resident)

    await expect(
      residentInstance.vote('topic 1', Options.YES)
    ).to.be.revertedWith('Only the manager or the residents can do this')
  })

  it('Should NOT vote in a topic (empty)', async function () {
    const { condominium, manager, accounts } = await loadFixture(deployFixture)

    await addResidents(condominium, 1, accounts)
    await condominium.addTopic(
      'topic 1',
      'description 1',
      Category.DECISION,
      0,
      manager.address
    )
    await condominium.openVoting('topic 1')

    const residentInstance = condominium.connect(accounts[0])

    await expect(
      residentInstance.vote('topic 1', Options.EMPTY)
    ).to.be.revertedWith('The option cannot be EMPTY')
  })

  it('Should NOT vote in a topic (topic not exists)', async function () {
    const { condominium, accounts } = await loadFixture(deployFixture)

    await addResidents(condominium, 1, accounts)

    const residentInstance = condominium.connect(accounts[0])

    await expect(
      residentInstance.vote('topic 1', Options.YES)
    ).to.be.revertedWith('Topic does not exists')
  })

  it('Should NOT vote in a topic (status)', async function () {
    const { condominium, manager, accounts } = await loadFixture(deployFixture)

    await addResidents(condominium, 1, accounts)
    await condominium.addTopic(
      'topic 1',
      'description 1',
      Category.DECISION,
      0,
      manager.address
    )

    const residentInstance = condominium.connect(accounts[0])

    await expect(
      residentInstance.vote('topic 1', Options.YES)
    ).to.be.revertedWith('Only VOTING topics can be voted')
  })

  it('Should NOT vote in a topic (defaulter)', async function () {
    const { condominium, manager, resident } = await loadFixture(deployFixture)

    await condominium.addResident(resident, 2505)
    await condominium.addTopic(
      'topic 1',
      'description 1',
      Category.DECISION,
      0,
      manager.address
    )
    await condominium.openVoting('topic 1')

    const residentInstance = condominium.connect(resident)

    await expect(
      residentInstance.vote('topic 1', Options.YES)
    ).to.be.revertedWith('The resident must be defaulter')
  })

  it('Should NOT vote twice in a topic', async function () {
    const { condominium, manager, accounts } = await loadFixture(deployFixture)

    await addResidents(condominium, 1, accounts)
    await condominium.addTopic(
      'topic 1',
      'description 1',
      Category.DECISION,
      0,
      manager.address
    )
    await condominium.openVoting('topic 1')

    const residentInstance = condominium.connect(accounts[0])

    await residentInstance.vote('topic 1', Options.YES)

    await expect(
      residentInstance.vote('topic 1', Options.YES)
    ).to.be.revertedWith('A residence should vote only once')
  })

  it('Should close voting', async function () {
    const { condominium, manager, accounts } = await loadFixture(deployFixture)

    await addResidents(condominium, 6, accounts)
    await condominium.addTopic(
      'topic 1',
      'description 1',
      Category.DECISION,
      0,
      manager.address
    )
    await condominium.openVoting('topic 1')

    await addVotes(condominium, 5, accounts, false)
    const residentInstance = condominium.connect(accounts[5])
    await residentInstance.vote('topic 1', Options.ABSTENTION)

    await condominium.closeVoting('topic 1')

    const topic = await condominium.getTopic('topic 1')

    expect(topic.status).to.equal(Status.DENIED)
  })

  it('Should NOT close voting (permission)', async function () {
    const { condominium, resident, manager } = await loadFixture(deployFixture)

    await condominium.addResident(resident.address, 2505)
    await condominium.addTopic(
      'topic 1',
      'description 1',
      Category.DECISION,
      0,
      manager.address
    )
    await condominium.openVoting('topic 1')

    const residentInstance = condominium.connect(resident)

    await expect(residentInstance.closeVoting('topic 1')).to.be.revertedWith(
      'Only the manager can do this'
    )
  })

  it('Should NOT close voting (topic not exists)', async function () {
    const { condominium } = await loadFixture(deployFixture)

    await expect(condominium.closeVoting('topic 1')).to.be.revertedWith(
      'Topic does not exists'
    )
  })

  it('Should NOT close voting (status)', async function () {
    const { condominium, resident, manager } = await loadFixture(deployFixture)

    await condominium.addResident(resident.address, 2505)
    await condominium.addTopic(
      'topic 1',
      'description 1',
      Category.DECISION,
      0,
      manager.address
    )

    await expect(condominium.closeVoting('topic 1')).to.be.revertedWith(
      'Only VOTING topics can be closed'
    )
  })

  it('Should NOT close voting (minimum votes)', async function () {
    const { condominium, manager } = await loadFixture(deployFixture)

    await condominium.addTopic(
      'topic 1',
      'description 1',
      Category.DECISION,
      0,
      manager.address
    )
    await condominium.openVoting('topic 1')

    await expect(condominium.closeVoting('topic 1')).to.be.revertedWith(
      'You cannot finish a voting without the minimum votes'
    )
  })

  it('Should NOT pay quota (residence)', async function () {
    const { condominium } = await loadFixture(deployFixture)

    await expect(
      condominium.payQuota(2506, { value: parseEther('0.001') })
    ).to.be.revertedWith('The residence does not exists')
  })

  it('Should NOT pay quota (amount)', async function () {
    const { condominium } = await loadFixture(deployFixture)

    await expect(
      condominium.payQuota(2505, { value: parseEther('0.0001') })
    ).to.be.revertedWith('Wrong value')
  })

  it('Should NOT pay quota (duplicated)', async function () {
    const { condominium } = await loadFixture(deployFixture)

    await condominium.payQuota(2505, { value: parseEther('0.001') })

    await expect(
      condominium.payQuota(2505, { value: parseEther('0.001') })
    ).to.be.revertedWith('You cannot pay twice a month')
  })

  it('Should NOT transfer (permission)', async function () {
    const { condominium, resident } = await loadFixture(deployFixture)

    const residentInstance = condominium.connect(resident)

    await expect(residentInstance.transfer('topic 1', 100)).to.be.revertedWith(
      'Only the manager can do this'
    )
  })

  it('Should NOT transfer (insufficient funds)', async function () {
    const { condominium } = await loadFixture(deployFixture)

    await expect(condominium.transfer('topic 1', 100)).to.be.revertedWith(
      'Insufficient funds'
    )
  })

  it('Should NOT transfer (topic)', async function () {
    const { condominium, accounts } = await loadFixture(deployFixture)

    await addResidents(condominium, 1, accounts)

    await expect(condominium.transfer('topic 1', 100)).to.be.revertedWith(
      'Only APPROVED SPENT topics can be used for transfers'
    )
  })

  it('Should NOT transfer (higher amount)', async function () {
    const { condominium, accounts } = await loadFixture(deployFixture)

    await addResidents(condominium, 10, accounts)

    await condominium.addTopic(
      'topic 1',
      'description 1',
      Category.SPENT,
      100,
      accounts[0]
    )

    await condominium.openVoting('topic 1')

    await addVotes(condominium, 10, accounts)

    await condominium.closeVoting('topic 1')

    await expect(condominium.transfer('topic 1', 101)).to.be.revertedWith(
      'The amount must be less or equal the APPROVED topic'
    )
  })

  it('Should pay quota', async function () {
    const { condominium, resident } = await loadFixture(deployFixture)

    await condominium.addResident(resident.address, 2505)

    const residentInstance = condominium.connect(resident)

    await residentInstance.payQuota(2505, { value: parseEther('0.001') })

    const residentBefore = await condominium.getResident(resident.address)

    await time.setNextBlockTimestamp(
      Number.parseInt(`${Date.now() / 1000 + 31 * 24 * 60 * 60}`)
    )

    await residentInstance.payQuota(2505, { value: parseEther('0.001') })

    const residentAfter = await condominium.getResident(resident.address)

    const firstPaymentPlusThirtyDays =
      residentBefore.nextPayment + 30n * 24n * 60n * 60n

    expect(residentAfter.nextPayment).to.equal(firstPaymentPlusThirtyDays)
  })
})
