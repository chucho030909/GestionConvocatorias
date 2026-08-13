using System.Security.Cryptography;
using System.Text;

namespace GestionConvocatorias.Identity.Api.Services;

public static class PasswordHasher
{
    private const int SaltSize = 16;
    private const int KeySize = 32;
    private const int Iterations = 100_000;

    public static string Hash(string password)
    {
        var salt = RandomNumberGenerator.GetBytes(SaltSize);
        var key = Rfc2898DeriveBytes.Pbkdf2(
            Encoding.UTF8.GetBytes(password),
            salt,
            Iterations,
            HashAlgorithmName.SHA256,
            KeySize);

        var combined = new byte[SaltSize + KeySize];
        Buffer.BlockCopy(salt, 0, combined, 0, SaltSize);
        Buffer.BlockCopy(key, 0, combined, SaltSize, KeySize);

        return $"{Iterations}.{Convert.ToBase64String(combined)}";
    }

    public static bool Verify(string password, string storedHash)
    {
        var parts = storedHash.Split('.');
        if (parts.Length != 2 || !int.TryParse(parts[0], out var iterations))
            return false;

        var combined = Convert.FromBase64String(parts[1]);
        if (combined.Length != SaltSize + KeySize)
            return false;

        var salt = new byte[SaltSize];
        Buffer.BlockCopy(combined, 0, salt, 0, SaltSize);

        var key = Rfc2898DeriveBytes.Pbkdf2(
            Encoding.UTF8.GetBytes(password),
            salt,
            iterations,
            HashAlgorithmName.SHA256,
            KeySize);

        var storedKey = new byte[KeySize];
        Buffer.BlockCopy(combined, SaltSize, storedKey, 0, KeySize);

        return CryptographicOperations.FixedTimeEquals(key, storedKey);
    }
}
