'use strict'
const bcrypt = require('bcrypt')

// npx sequelize-cli seed:generate --name demo-user

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    /**
     * Add seed commands here.
     *
     * Example:
     * await queryInterface.bulkInsert('People', [{
     *   name: 'John Doe',
     *   isBetaMember: false
     * }], {});
     */
    return queryInterface.bulkInsert('Users', [
      {
        username: 'jdoe',
        firstName: 'John',
        lastName: 'Doe',
        email: 'example@domain.com',
        createdAt: new Date(),
        updatedAt: new Date(),
        password: (() => {
          const unHashedPassword = 'password'
          const salt = bcrypt.genSaltSync(10, 'a')
          return bcrypt.hashSync(unHashedPassword, salt)
        })()
      }
    ])
  },

  async down (queryInterface, Sequelize) {
    /**
     * Add commands to revert seed here.
     *
     * Example:
     * await queryInterface.bulkDelete('People', null, {});
     */
    return queryInterface.bulkDelete('Users', null, {})
  }
}
