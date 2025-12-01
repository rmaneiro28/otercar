export const formatVenezuelanPhone = (value) => {
    // Remove all non-numeric characters
    const numbers = value.replace(/\D/g, '');

    // Handle backspace/empty
    if (numbers.length === 0) return '';

    // If user types 58 or +58, strip it to handle the logic cleanly
    let cleanNumber = numbers;
    if (numbers.startsWith('58')) {
        cleanNumber = numbers.substring(2);
    }

    // Limit to max length (3 digit area code + 7 digit number = 10 digits)
    cleanNumber = cleanNumber.substring(0, 10);

    // Build the formatted string
    let formatted = '+58';

    if (cleanNumber.length > 0) {
        formatted += '-' + cleanNumber.substring(0, 3);
    }
    if (cleanNumber.length > 3) {
        formatted += '-' + cleanNumber.substring(3, 6);
    }
    if (cleanNumber.length > 6) {
        formatted += '-' + cleanNumber.substring(6, 10);
    }

    return formatted;
};
