import { randomBytes } from 'node:crypto';

/**
 * Generates a random booking confirmation code.
 * Uniqueness is enforced by the database.
 * @returns {string} A booking confirmation code.
 */
const generateConfirmationCode = () => {
    return 'JR' + randomBytes(6).toString('hex').toUpperCase();
};

/**
 * Converts kilometers to miles.
 * @param {number} km - The distance in kilometers.
 * @returns {number} The equivalent distance in miles.
 */
const kmToMiles = (km) => {
    const conversionFactor = 0.621371;
    return km * conversionFactor;
};

/**
 * Converts Japanese Yen to US Dollars.
 * @param {number} yen - The amount in Japanese Yen.
 * @returns {number} The equivalent amount in US Dollars.
 */
const yenToUsd = (yen) => {
    const exchangeRate = 0.0066; // Example rate: 1 Yen = 0.0066 USD
    return yen * exchangeRate;
};

export { generateConfirmationCode, kmToMiles, yenToUsd };