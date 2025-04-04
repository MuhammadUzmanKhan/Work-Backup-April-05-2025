export namespace ApiTypes {
    export interface Authenticate {
        idToken: string;
    }
    export interface VerifyOtp extends Authenticate {
        otp: string;
    }
    export interface Notification {
        title: string,
        notice: string,
        callToAction?: string,
        startDate: Date,
        endDate: Date
    }

    export interface ExtensionRelease {
        version: string,
        message: string,
        forced: boolean
    }
}