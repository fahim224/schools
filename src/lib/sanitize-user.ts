type SensitiveUserFields = "password" | "resetPasswordToken" | "resetPasswordExpires";

export function sanitizeUser<T extends object>(user: T): Omit<T, SensitiveUserFields> {
    const safeUser = { ...user } as Record<string, unknown>;
    delete safeUser.password;
    delete safeUser.resetPasswordToken;
    delete safeUser.resetPasswordExpires;
    return safeUser as Omit<T, SensitiveUserFields>;
}
