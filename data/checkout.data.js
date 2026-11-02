const validCustomer = { firstName: 'Ada', lastName: 'Lovelace', postalCode: '90210' };

const invalidCustomers = [
  {
    name: 'an empty first name',
    customer: { ...validCustomer, firstName: '' },
    error: 'Error: First Name is required',
  },
  {
    name: 'an empty last name',
    customer: { ...validCustomer, lastName: '' },
    error: 'Error: Last Name is required',
  },
  {
    name: 'an empty postal code',
    customer: { ...validCustomer, postalCode: '' },
    error: 'Error: Postal Code is required',
  },
  {
    name: 'a form with every field empty',
    customer: { firstName: '', lastName: '', postalCode: '' },
    error: 'Error: First Name is required',
  },
];

module.exports = { validCustomer, invalidCustomers };
