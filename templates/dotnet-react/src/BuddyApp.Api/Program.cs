using System.Security.Claims;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authorization;

var builder = WebApplication.CreateBuilder(args);

// The session travels in an HttpOnly, Secure, SameSite cookie (SEC-4). An API answers 401 and 403 instead of
// redirecting to a sign-in page. Until a real provider arrives (SEC-5), the stub sign-in fills this cookie in Development.
builder.Services.AddAuthentication(CookieAuthenticationDefaults.AuthenticationScheme)
    .AddCookie(options =>
    {
        options.Cookie.HttpOnly = true;
        options.Cookie.SecurePolicy = CookieSecurePolicy.Always;
        options.Cookie.SameSite = SameSiteMode.Lax;
        options.Events.OnRedirectToLogin = context =>
        {
            context.Response.StatusCode = StatusCodes.Status401Unauthorized;
            return Task.CompletedTask;
        };
        options.Events.OnRedirectToAccessDenied = context =>
        {
            context.Response.StatusCode = StatusCodes.Status403Forbidden;
            return Task.CompletedTask;
        };
    });

// Every endpoint asks for a signed-in user unless it says AllowAnonymous and is on the approved list in the tests (TST-3).
builder.Services.AddAuthorizationBuilder()
    .SetFallbackPolicy(new AuthorizationPolicyBuilder().RequireAuthenticatedUser().Build());

var app = builder.Build();

// The security headers, on every response (TST-3): the API serves JSON only, so nothing may frame it,
// sniff it as another type, or be loaded by it.
app.Use(async (context, next) =>
{
    var headers = context.Response.Headers;
    headers.XContentTypeOptions = "nosniff";
    headers.XFrameOptions = "DENY";
    headers["Referrer-Policy"] = "no-referrer";
    headers.ContentSecurityPolicy = "default-src 'none'; frame-ancestors 'none'";
    await next(context);
});

app.UseAuthentication();
app.UseAuthorization();

app.MapGet("/api/health", () => Results.Ok(new { status = "ok" })).AllowAnonymous();

// Who is signed in; protected by the fallback policy like every endpoint not on the approved list.
app.MapGet("/api/me", (ClaimsPrincipal user) => Results.Ok(new
{
    name = user.FindFirstValue(ClaimTypes.Name),
    email = user.FindFirstValue(ClaimTypes.Email),
    roles = user.FindAll(ClaimTypes.Role).Select(c => c.Value),
}));

// The stub sign-in exists only in Development (SEC-6); StubSignInTests fails if it is registered anywhere else.
if (app.Environment.IsDevelopment())
{
    app.MapStubSignIn();
}

app.Run();

// Lets the tests start the app through WebApplicationFactory<Program>.
public partial class Program;
