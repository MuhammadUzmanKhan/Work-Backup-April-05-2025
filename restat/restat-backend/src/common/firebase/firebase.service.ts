import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import admin, { app } from 'firebase-admin';
import { DecodedIdToken } from 'firebase-admin/lib/auth/token-verifier';
import { UserRecord } from 'firebase-admin/lib/auth/user-record';

@Injectable()
export default class FirebaseService {
    public static app: app.App;

    public static initializeApp() {
        if (!FirebaseService.app) {
            const configService = new ConfigService();

            FirebaseService.app = admin.initializeApp({
                credential: admin.credential.cert({
                    projectId: configService.get("FIREBASE_KEY_project_id"),
                    clientEmail: configService.get("FIREBASE_KEY_client_email"),
                    privateKey: configService.get("FIREBASE_KEY_private_key").split("\\n").join("\n"),
                }),
            });
        }
    }

    static async decodeIdToken(idToken: string): Promise<{ user: DecodedIdToken, additionalInformation: UserRecord }> {
        const user = await FirebaseService.app.auth().verifyIdToken(idToken);
        const additionalInformation = await FirebaseService.app.auth().getUser(user.uid)

        return {
            user,
            additionalInformation
        };
    }

    static async getUserByEmail(email: string): Promise<any> {
        try {
            return await FirebaseService.app.auth().getUserByEmail(email);
        } catch {
            return false
        }
    }

    static async createSuperUser(email: string, password: string, displayName: string) {
        let superUser;
        try {
            // Attempt to create a new user
            superUser = await FirebaseService.app.auth().createUser({
                email,
                password,
                displayName,
            });

        } catch (error: any) {
            // Check if the error is because the user already exists
            if (error.code === 'auth/email-already-exists') {
                // User already exists, fetch the user
                superUser = await FirebaseService.app.auth().getUserByEmail(email);

                // Update the user's password
                await FirebaseService.app.auth().updateUser(superUser.uid, { password, displayName });
            } else {
                // Handle other errors
                throw error;
            }
        }

        const additionalInformation = await FirebaseService.app.auth().getUser(superUser.uid);

        return {
            superUser,
            additionalInformation
        }
    }

    public static async deleteFirebaseUserByEmail(email: string): Promise<void> {
        try {
            // Get user by email to retrieve UID
            const userRecord = await FirebaseService.app.auth().getUserByEmail(email);

            // Delete user by UID
            await FirebaseService.app.auth().deleteUser(userRecord.uid);
            console.info(`Successfully deleted user with email: ${email}`);
        } catch (error: any) {
            if (error.code === 'auth/user-not-found') {
                throw new NotFoundException(`User with email ${email} not found.`);
            } else {
                console.error(`Error deleting user with email ${email}:`, error);
                throw error;
            }
        }
    }
}
