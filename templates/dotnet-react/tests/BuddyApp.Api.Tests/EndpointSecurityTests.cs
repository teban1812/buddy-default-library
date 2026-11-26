using System.Net;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.Routing;
using Microsoft.Extensions.DependencyInjection;

namespace BuddyApp.Api.Tests;

// TST-3: these tests start the application and read what it really serves, so they see Minimal API endpoints,
// which an architecture test of the compiled code cannot.
public class EndpointSecurityTests(WebApplicationFactory<Program> factory)
    : IClassFixture<WebApplicationFactory<Program>>
{
    // The approved list: the only endpoints anyone may call without signing in. Adding one here is a decision
    // the reviewer sees in the change; every other endpoint must ask for permission.
    private static readonly HashSet<string> ApprovedAnonymous =
    [
        "GET /api/health",
    ];

    // The headers the security middleware in Program.cs sets on every response, with their values.
    public static TheoryData<string, string> SecurityHeaders => new()
    {
        { "X-Content-Type-Options", "nosniff" },
        { "X-Frame-Options", "DENY" },
        { "Referrer-Policy", "no-referrer" },
        { "Content-Security-Policy", "default-src 'none'; frame-ancestors 'none'" },
    };

    [Fact]
    public async Task Every_endpoint_asks_for_permission_unless_it_is_on_the_approved_list()
    {
        // No authorization registered at all means no fallback policy: every endpoint without metadata is open.
        var policies = factory.Services.GetService<IAuthorizationPolicyProvider>();
        var fallback = policies is null ? null : await policies.GetFallbackPolicyAsync();
        var endpoints = factory.Services.GetRequiredService<EndpointDataSource>().Endpoints.OfType<RouteEndpoint>();

        var open = endpoints
            .Where(e => IsOpen(e, fallback))
            .Select(Describe)
            .Where(name => !ApprovedAnonymous.Contains(name))
            .ToList();

        Assert.True(open.Count == 0,
            $"These endpoints answer without permission and are not on the approved list in EndpointSecurityTests: " +
            $"{string.Join(", ", open)}. Ask for permission (RequireAuthorization) or approve them on the list.");
    }

    [Fact]
    public async Task An_unauthenticated_call_outside_the_approved_list_gets_401()
    {
        var client = factory.CreateClient(new WebApplicationFactoryClientOptions { AllowAutoRedirect = false });

        var response = await client.GetAsync("/api/not-on-the-approved-list");

        Assert.True(response.StatusCode == HttpStatusCode.Unauthorized,
            $"An unauthenticated call outside the approved list got {(int)response.StatusCode} instead of 401: " +
            "the authentication or the authorization that refuses it is missing in Program.cs.");
    }

    [Theory]
    [MemberData(nameof(SecurityHeaders))]
    public async Task Every_response_carries_the_security_headers(string header, string value)
    {
        var client = factory.CreateClient(new WebApplicationFactoryClientOptions { AllowAutoRedirect = false });

        foreach (var path in new[] { "/api/health", "/api/not-on-the-approved-list" })
        {
            var response = await client.GetAsync(path);

            Assert.True(response.Headers.TryGetValues(header, out var values),
                $"The response to {path} lacks the security header {header}: the middleware in Program.cs that sets it is missing.");
            Assert.Equal(value, string.Join(", ", values!));
        }
    }

    private static bool IsOpen(Endpoint endpoint, AuthorizationPolicy? fallback)
    {
        if (endpoint.Metadata.GetMetadata<IAllowAnonymous>() is not null) return true;
        var asksForPermission = endpoint.Metadata.GetOrderedMetadata<IAuthorizeData>().Count > 0
            || endpoint.Metadata.GetMetadata<AuthorizationPolicy>() is not null;
        return !asksForPermission && fallback is null;
    }

    private static string Describe(RouteEndpoint endpoint)
    {
        var methods = endpoint.Metadata.GetMetadata<IHttpMethodMetadata>()?.HttpMethods ?? ["ANY"];
        return $"{string.Join("|", methods)} {endpoint.RoutePattern.RawText}";
    }
}
