export type LoginErrorKind = "credentials" | "network" | "configuration" | "unexpected";

type AuthErrorLike = { code?: string; message?: string; name?: string };

export function classifyLoginError(error: unknown): LoginErrorKind {
    const candidate = error as AuthErrorLike | null;
    const code = candidate?.code?.toLowerCase();
    const message = candidate?.message?.toLowerCase() ?? "";
    if (code === "invalid_credentials" || message.includes("invalid login credentials")) return "credentials";
    if (candidate?.name === "TypeError" || message.includes("failed to fetch") || message.includes("network")) return "network";
    if (candidate?.name === "SupabaseConfigurationError") return "configuration";
    return "unexpected";
}

export function getLoginErrorMessage(kind: LoginErrorKind): string {
    switch (kind) {
        case "credentials": return "Email atau password salah.";
        case "network": return "Tidak dapat terhubung ke layanan login. Periksa koneksi lalu coba lagi.";
        case "configuration": return "Layanan login belum dikonfigurasi. Hubungi IT Support.";
        default: return "Login gagal. Silakan coba lagi atau hubungi IT Support.";
    }
}
