using System.Net;
using System.Net.Http.Json;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.Routing;
using Microsoft.Extensions.DependencyInjection;

namespace BuddyApp.Api.Tests;

// SEC-6: the stub sign-in lets the project work before a real provider exists, and only in Development.
// The test environment keeps production's posture, so the stub must be absent from every other environment.
public class StubSignInTests(WebApplicationFactory<Program> factory)
    : IClassFixture<WebApplicationFactory<Program>>
{
    private const string SignInPath = "/api/dev/sign-in";

    public static TheoryData<string> EnvironmentsWithoutTheStub => new() { "Production", "Staging" };

    [Fact]
    public async Task In_Development_the_stub_user_gets_through_a_protected_call()
    {
        var client = ClientFor("Development");

        var signIn = await client.PostAsync(SignInPath, null);
        Assert.Equal(HttpStatusCode.NoContent, signIn.StatusCode);

        var me = await client.GetAsync("/api/me");
        Assert.True(me.StatusCode == HttpStatusCode.OK,
            $"After the stub sign-in, the protected GET /api/me got {(int)me.StatusCode} instead of 200.");
        var user = await me.Content.ReadFromJsonAsync<SignedInUser>();
        Assert.NotNull(user);
        Assert.Equal("Dev User", user.Name);
        Assert.Equal("dev@example.com", user.Email);
        Assert.Equal(["Member"], user.Roles);
    }

    [Theory]
    [MemberData(nameof(EnvironmentsWithoutTheStub))]
    public void Outside_Development_the_stub_sign_in_is_not_registered(string environment)
    {
        var app = factory.WithWebHostBuilder(builder => builder.UseEnvironment(environment));

        var routes = app.Services.GetRequiredService<EndpointDataSource>().Endpoints
            .OfType<RouteEndpoint>()
            .Select(e => "/" + e.RoutePattern.RawText?.TrimStart('/'));

        Assert.True(!routes.Contains(SignInPath),
            $"The stub sign-in {SignInPath} is registered in {environment}: it must exist only in Development " +
            "(Program.cs maps it inside `if (app.Environment.IsDevelopment())`).");
    }

    [Theory]
    [MemberData(nameof(EnvironmentsWithoutTheStub))]
    public async Task Outside_Development_a_protected_call_without_a_real_session_gets_401(string environment)
    {
        var client = ClientFor(environment);

        await client.PostAsync(SignInPath, null);
        var me = await client.GetAsync("/api/me");

        Assert.True(me.StatusCode == HttpStatusCode.Unauthorized,
            $"In {environment}, a protected call after trying the stub sign-in got {(int)me.StatusCode} instead of 401: " +
            "the stub let someone in outside Development.");
    }

    // HTTPS, because the session cookie is Secure (SEC-4) and the client keeps it only on HTTPS.
    private HttpClient ClientFor(string environment) =>
        factory.WithWebHostBuilder(builder => builder.UseEnvironment(environment))
            .CreateClient(new WebApplicationFactoryClientOptions
            {
                AllowAutoRedirect = false,
                BaseAddress = new Uri("https://localhost"),
            });

    private sealed record SignedInUser(string Name, string Email, string[] Roles);
}
