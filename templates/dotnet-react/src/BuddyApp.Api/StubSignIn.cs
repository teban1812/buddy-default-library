using System.Security.Claims;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;

// The stub sign-in (SEC-6): until the project has a real identity provider, POST /api/dev/sign-in signs in a made-up
// user into the same session cookie a real provider will use. Program.cs maps it only in Development; a real provider
// (Entra ID, say) replaces this file and that one line, and the rest (the cookie, the fallback policy, the endpoints) stays.
public static class StubSignIn
{
    public const string Path = "/api/dev/sign-in";

    public static void MapStubSignIn(this WebApplication app) =>
        app.MapPost(Path, async (HttpContext context) =>
        {
            var identity = new ClaimsIdentity(
                [
                    new Claim(ClaimTypes.Name, "Dev User"),
                    new Claim(ClaimTypes.Email, "dev@example.com"),
                    new Claim(ClaimTypes.Role, "Member"),
                ],
                CookieAuthenticationDefaults.AuthenticationScheme);
            await context.SignInAsync(CookieAuthenticationDefaults.AuthenticationScheme, new ClaimsPrincipal(identity));
            return Results.NoContent();
        }).AllowAnonymous();
}
