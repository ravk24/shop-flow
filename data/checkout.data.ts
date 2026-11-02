export interface Customer {
  firstName: string;
  lastName: string;
  postalCode: string;
}

export interface InvalidCustomerCase {
  name: string;
  customer: Customer;
  error: string;
}

const validCustomer: Customer = { firstName: 'Ada', lastName: 'Lovelace', postalCode: '90210' };

const invalidCustomers: InvalidCustomerCase[] = [
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

export { validCustomer, invalidCustomers };
