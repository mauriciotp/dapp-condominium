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
    ).to.be.revertedWith('Only the manager can do this')
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

  // it('Should set manager', async function () {
  //   const { condominium, counselor } = await loadFixture(deployFixture)

  //   await condominium.setManager(counselor.address)

  //   expect(await condominium.manager()).to.equal(counselor.address)
  // })

  // it('Should NOT set manager (manager)', async function () {
  //   const { condominium, resident } = await loadFixture(deployFixture)

  //   const residentInstance = condominium.connect(resident)

  //   await expect(
  //     residentInstance.setManager(resident.address)
  //   ).to.be.revertedWith('Only the manager can do this')
  // })

  // it('Should NOT set manager (address)', async function () {
  //   const { condominium } = await loadFixture(deployFixture)

  //   await expect(condominium.setManager(ZeroAddress)).to.be.revertedWith(
  //     'The address must be valid'
  //   )
  // })

  it('Should add topic (manager)', async function () {
    const { condominium } = await loadFixture(deployFixture)

    await condominium.addTopic('topic 1', 'description 1')

    expect(await condominium.topicExists('topic 1')).to.equal(true)
  })

  it('Should add topic (resident)', async function () {
    const { condominium, resident } = await loadFixture(deployFixture)

    await condominium.addResident(resident, 2505)

    const residentInstance = condominium.connect(resident)

    await residentInstance.addTopic('topic 1', 'description 1')

    expect(await condominium.topicExists('topic 1')).to.equal(true)
  })

  it('Should NOT add topic (permission)', async function () {
    const { condominium, resident } = await loadFixture(deployFixture)

    const residentInstance = condominium.connect(resident)

    await expect(
      residentInstance.addTopic('topic 1', 'description 1')
    ).to.be.revertedWith('Only the manager or the residents can do this')
  })

  it('Should NOT add topic (topic exists)', async function () {
    const { condominium } = await loadFixture(deployFixture)

    await condominium.addTopic('topic 1', 'description 1')

    await expect(
      condominium.addTopic('topic 1', 'description 1')
    ).to.be.revertedWith('Topic already exists')
  })

  it('Should remove topic', async function () {
    const { condominium } = await loadFixture(deployFixture)

    await condominium.addTopic('topic 1', 'description 1')

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
    const { condominium } = await loadFixture(deployFixture)

    await condominium.addTopic('topic 1', 'description 1')

    await condominium.openVoting('topic 1')

    await expect(condominium.removeTopic('topic 1')).to.be.revertedWith(
      'Only IDLE topics can be removed'
    )
  })

  it('Should open topic to voting', async function () {
    const { condominium } = await loadFixture(deployFixture)

    await condominium.addTopic('topic 1', 'description 1')

    await condominium.openVoting('topic 1')

    const topic = await condominium.getTopic('topic 1')

    const newStatus = topic.status

    expect(newStatus).to.equal(Status.VOTING)
  })

  it('Should NOT open topic to voting (permission)', async function () {
    const { condominium, resident } = await loadFixture(deployFixture)

    await condominium.addResident(resident.address, 2505)

    await condominium.addTopic('topic 1', 'description 1')

    const residentInstance = condominium.connect(resident)

    await expect(residentInstance.openVoting('topic 1')).to.be.revertedWith(
      'Only the manager can do this'
    )
  })

  it('Should NOT open topic to voting (status)', async function () {
    const { condominium } = await loadFixture(deployFixture)

    await condominium.addTopic('topic 1', 'description 1')

    await condominium.openVoting('topic 1')

    await expect(condominium.openVoting('topic 1')).to.be.revertedWith(
      'Only IDLE topics can be open to voting'
    )
  })

  it('Should vote in a topic', async function () {
    const { condominium, resident } = await loadFixture(deployFixture)

    await condominium.addResident(resident.address, 2505)
    await condominium.addTopic('topic 1', 'description 1')
    await condominium.openVoting('topic 1')

    const residentInstance = condominium.connect(resident)

    await residentInstance.vote('topic 1', Options.YES)

    expect(await condominium.numberOfVotes('topic 1')).to.equal(1)
  })

  it('Should NOT vote in a topic (permission)', async function () {
    const { condominium, resident } = await loadFixture(deployFixture)

    await condominium.addTopic('topic 1', 'description 1')
    await condominium.openVoting('topic 1')

    const residentInstance = condominium.connect(resident)

    await expect(
      residentInstance.vote('topic 1', Options.YES)
    ).to.be.revertedWith('Only the manager or the residents can do this')
  })

  it('Should NOT vote in a topic (empty)', async function () {
    const { condominium, resident } = await loadFixture(deployFixture)

    await condominium.addResident(resident.address, 2505)
    await condominium.addTopic('topic 1', 'description 1')
    await condominium.openVoting('topic 1')

    const residentInstance = condominium.connect(resident)

    await expect(
      residentInstance.vote('topic 1', Options.EMPTY)
    ).to.be.revertedWith('The option cannot be EMPTY')
  })

  it('Should NOT vote in a topic (topic)', async function () {
    const { condominium, resident } = await loadFixture(deployFixture)

    await condominium.addResident(resident.address, 2505)

    const residentInstance = condominium.connect(resident)

    await expect(
      residentInstance.vote('topic 1', Options.YES)
    ).to.be.revertedWith('Topic does not exists')
  })

  it('Should NOT vote in a topic (status)', async function () {
    const { condominium, resident } = await loadFixture(deployFixture)

    await condominium.addResident(resident.address, 2505)
    await condominium.addTopic('topic 1', 'description 1')

    const residentInstance = condominium.connect(resident)

    await expect(
      residentInstance.vote('topic 1', Options.YES)
    ).to.be.revertedWith('Only VOTING topics can be voted')
  })

  it('Should NOT vote twice in a topic', async function () {
    const { condominium, resident } = await loadFixture(deployFixture)

    await condominium.addResident(resident.address, 2505)
    await condominium.addTopic('topic 1', 'description 1')
    await condominium.openVoting('topic 1')

    const residentInstance = condominium.connect(resident)

    await residentInstance.vote('topic 1', Options.YES)

    await expect(
      residentInstance.vote('topic 1', Options.YES)
    ).to.be.revertedWith('A residence should vote only once')
  })

  it('Should close voting', async function () {
    const { condominium, resident } = await loadFixture(deployFixture)

    await condominium.addResident(resident.address, 2505)
    await condominium.addTopic('topic 1', 'description 1')
    await condominium.openVoting('topic 1')

    await condominium.vote('topic 1', Options.YES)
    const residentInstance = condominium.connect(resident)

    await residentInstance.vote('topic 1', Options.YES)

    await condominium.closeVoting('topic 1')

    const topic = await condominium.getTopic('topic 1')

    expect(topic.status).to.equal(Status.APPROVED)
  })

  it('Should NOT close voting (permission)', async function () {
    const { condominium, resident } = await loadFixture(deployFixture)

    await condominium.addResident(resident.address, 2505)
    await condominium.addTopic('topic 1', 'description 1')
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
    const { condominium, resident } = await loadFixture(deployFixture)

    await condominium.addResident(resident.address, 2505)
    await condominium.addTopic('topic 1', 'description 1')

    await expect(condominium.closeVoting('topic 1')).to.be.revertedWith(
      'Only VOTING topics can be closed'
    )
  })
})
