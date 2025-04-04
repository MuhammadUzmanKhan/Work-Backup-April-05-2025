import { Injectable } from '@nestjs/common';

@Injectable()
export default class PasswordGeneratorService {

    public static async generatePassword() {
        const upperCaseChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        const lowerCaseChars = 'abcdefghijklmnopqrstuvwxyz';
        const specialChars = '!@#$%^&*()-_=+[]{}|;:,.<>?';
        const numericChars = '0123456789';

        const getRandomChar = (characters: string) => characters[Math.floor(Math.random() * characters.length)];

        let password = '';
        password += getRandomChar(upperCaseChars);
        password += getRandomChar(lowerCaseChars);
        password += getRandomChar(specialChars);
        password += getRandomChar(numericChars);

        for (let i = 4; i < 8; i++) {
            const charSet = [upperCaseChars, lowerCaseChars, specialChars, numericChars];
            const randomCharSet = charSet[Math.floor(Math.random() * charSet.length)];
            password += getRandomChar(randomCharSet);
        }

        // Shuffle the password to randomize the order of characters
        password = password.split('').sort(() => 0.5 - Math.random()).join('');

        return password;
    }
}
