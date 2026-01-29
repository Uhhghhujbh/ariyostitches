
// Simple input validation helpers

export const validateEmail = (email) => {
    return String(email)
        .toLowerCase()
        .match(
            /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
        );
};

export const sanitizeString = (str) => {
    if (!str) return '';
    return str.replace(/[<>]/g, ''); // Basic XSS prevention
};

export const validateProduct = (data) => {
    const errors = [];
    if (!data.name) errors.push('Name is required');
    if (!data.price || isNaN(data.price)) errors.push('Valid price is required');
    if (!data.image_url) errors.push('Image URL is required');
    return errors;
};

export const validateOrder = (data) => {
    const errors = [];
    if (!data.customer || !data.customer.email) errors.push('Customer email is required');
    if (!data.items || !data.items.length) errors.push('Cart is empty');
    if (!data.total) errors.push('Total amount is required');
    if (!data.paymentRef) errors.push('Payment reference is required');
    return errors;
};
